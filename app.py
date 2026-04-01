from flask import Flask, render_template, request, redirect, url_for, flash
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
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


@app.route('/submit', methods=['POST'])
def submit_chat():
    title = request.form.get('title', '').strip()
    content = request.form.get('content', '').strip()
    
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
    
    return render_template('chat_detail.html', chat=chat)


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
    app.run(host='0.0.0.0', port=port, debug=False)
