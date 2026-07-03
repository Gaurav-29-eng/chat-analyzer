from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import sqlite3
from datetime import datetime
import os
import traceback
from flask_cors import CORS
from utils.chat_analyzer import (
    get_sentiment,
    get_top_words,
    get_summary,
    get_emoji_usage,
    get_links_shared,
    get_peak_hours,
    get_most_active_user
)
from utils.file_parser import extract_text
from utils.chat_parser import parse_messages

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Enable CORS for all routes
CORS(app)
DATABASE = 'chats.db'


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


def generate_summary(text, max_lines=3):
    """Generate a simple summary by taking first few lines or sentences."""
    lines = text.split('\n')
    non_empty_lines = [line.strip() for line in lines if line.strip()]
    
    if len(non_empty_lines) <= max_lines:
        return '\n'.join(non_empty_lines)
    
    # Take first 3 lines and add ellipsis
    summary_lines = non_empty_lines[:max_lines]
    return '\n'.join(summary_lines) + '...'


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze_chat():
    """Analyze chat content and return JSON response."""
    try:
        print("STEP 1: Request received at /analyze endpoint")

        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()

        print("STEP 2: Form data extracted")

        file = request.files.get('file-upload')
        if file and file.filename != '':
            print(f"STEP 3: File detected - {file.filename}")
            try:
                print("STEP 4: Starting file extraction")
                content = extract_text(file)
                print(f"STEP 5: File extracted successfully, length: {len(content)}")
            except ValueError as e:
                print(f"ERROR STEP: ValueError reading file: {str(e)}")
                print(traceback.format_exc())
                return jsonify({"success": False, "error": str(e)}), 400
            except Exception as e:
                print(f"ERROR STEP: Exception reading file: {str(e)}")
                print(traceback.format_exc())
                return jsonify({"success": False, "error": f'Error reading file: {str(e)}'}), 400
        else:
            print("STEP 3: No file uploaded, using form content")

        if not content:
            print("ERROR STEP: No content provided")
            return jsonify({"success": False, "error": 'Content is required!'}), 400

        print("STEP 6: Content validation starting")

        # Validate content - check for PDF/binary markers
        if content.strip().startswith('5 0 obj') or content.strip().startswith('%PDF'):
            print("ERROR STEP: PDF/binary content detected")
            return jsonify({"success": False, "error": 'Unsupported chat format. Please upload WhatsApp chat export (.txt) or plain text.'}), 400

        # Check for binary/non-printable characters
        if any(ord(char) > 127 and char not in '\n\r\t' for char in content[:1000]):
            print("ERROR STEP: Binary characters detected")
            return jsonify({"success": False, "error": 'Unsupported chat format. Please upload WhatsApp chat export (.txt) or plain text.'}), 400

        print("STEP 7: Content validation passed")

        # Parse messages from chat content
        try:
            print("STEP 8: Starting message parsing")
            messages = parse_messages(content)
            print(f"STEP 9: Parsed {len(messages)} messages successfully")
        except Exception as e:
            print(f"ERROR STEP: Parse error: {str(e)}")
            print(traceback.format_exc())
            return jsonify({"success": False, "error": 'Error parsing chat content. Please ensure the format is correct (e.g., DD/MM/YY, time - Name: Message)'}), 400

        message_texts = [m['message'] for m in messages]
        print(f"STEP 10: Extracted {len(message_texts)} message texts")

        if not messages:
            print("ERROR STEP: No messages parsed")
            return jsonify({"success": False, "error": 'No valid messages found in the chat content. Please ensure the format is correct (e.g., DD/MM/YY, time - Name: Message)'}), 400

        # Run analysis
        try:
            print("STEP 11: Starting sentiment analysis")
            sentiment = get_sentiment(message_texts)
            print("STEP 12: Sentiment analysis completed")

            print("STEP 13: Starting word frequency analysis")
            top_words = get_top_words(message_texts)
            print("STEP 14: Word frequency analysis completed")

            print("STEP 15: Starting summary generation")
            summary = get_summary(message_texts)
            print("STEP 16: Summary generation completed")

            print("STEP 17: Starting emoji analysis")
            emoji_usage = get_emoji_usage(message_texts)
            print("STEP 18: Emoji analysis completed")

            print("STEP 19: Starting link extraction")
            links_shared = get_links_shared(message_texts)
            print("STEP 20: Link extraction completed")

            print("STEP 21: Starting peak hours analysis")
            peak_hours = get_peak_hours(messages)
            print("STEP 22: Peak hours analysis completed")

            print("STEP 23: Starting active user analysis")
            most_active_user = get_most_active_user(messages)
            print("STEP 24: Active user analysis completed")

            print("STEP 25: All analysis completed successfully")
        except Exception as e:
            print(f"ERROR STEP: Analysis error: {str(e)}")
            print(traceback.format_exc())
            return jsonify({"success": False, "error": f'Error during analysis: {str(e)}'}), 500

        # Build response
        print("STEP 26: Building response")
        response = {
            'success': True,
            'message': 'Chat analyzed successfully!',
            'analysis': {
                'mood': sentiment['mood'],
                'score': sentiment['score'],
                'total_messages': len(messages),
                'avg_length': sum(len(m) for m in message_texts) // max(len(message_texts), 1)
            },
            'top_words': [{'word': w[0], 'count': w[1]} for w in top_words],
            'emoji_usage': emoji_usage,
            'links_shared': links_shared,
            'peak_hours': peak_hours,
            'most_active_user': most_active_user,
            'summary': summary
        }

        print("STEP 27: Returning JSON response")
        return jsonify(response)

    except Exception as e:
        print(f"ERROR STEP: Unexpected error in /analyze: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": 'An unexpected error occurred. Please try again.'}), 500


@app.route('/submit', methods=['POST'])
def submit_chat():
    title = request.form.get('title', '').strip()
    content = request.form.get('content', '').strip()

    file = request.files.get('file-upload')
    if file and file.filename != '':
        content = extract_text(file)

    if not title or not content:
        flash('Title and content are required!', 'error')
        return redirect(url_for('index'))

    summary = generate_summary(content)

    conn = get_db_connection()
    conn.execute(
        'INSERT INTO chats (title, content, summary) VALUES (?, ?, ?)',
        (title, content, summary)
    )
    conn.commit()
    conn.close()

    flash('Chat saved successfully!', 'success')
    return redirect(url_for('view_chats'))


@app.route('/chats')
def view_chats():
    search_query = request.args.get('search', '').strip()
    
    conn = get_db_connection()
    
    if search_query:
        # Search in title, content, and summary
        chats = conn.execute(
            '''SELECT * FROM chats 
               WHERE title LIKE ? OR content LIKE ? OR summary LIKE ?
               ORDER BY created_at DESC''',
            (f'%{search_query}%', f'%{search_query}%', f'%{search_query}%')
        ).fetchall()
    else:
        chats = conn.execute(
            'SELECT * FROM chats ORDER BY created_at DESC'
        ).fetchall()
    
    conn.close()
    
    return render_template('chats.html', chats=chats, search_query=search_query)


@app.route('/chat/<int:chat_id>')
def view_chat(chat_id):
    conn = get_db_connection()
    chat = conn.execute('SELECT * FROM chats WHERE id = ?', (chat_id,)).fetchone()
    conn.close()
    
    if chat is None:
        flash('Chat not found!', 'error')
        return redirect(url_for('view_chats'))
    
    messages = [chat['content']]
    analysis = get_sentiment(messages)
    
    return render_template('chat_detail.html', chat=chat, analysis=analysis)


@app.route('/delete/<int:chat_id>', methods=['POST'])
def delete_chat(chat_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM chats WHERE id = ?', (chat_id,))
    conn.commit()
    conn.close()
    
    flash('Chat deleted successfully!', 'success')
    return redirect(url_for('view_chats'))


@app.route('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.now().isoformat()}


# Initialize database on startup
init_db()


if __name__ == '__main__':
    # Get port from environment variable for Render compatibility
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
