import re
from collections import Counter
from datetime import datetime

positive_words = ["happy", "good", "love", "great", "nice", "awesome", "excellent", "amazing", "wonderful", "fantastic"]
negative_words = ["sad", "bad", "angry", "hate", "sorry", "terrible", "awful", "horrible", "disappointed", "upset"]

# Emoji pattern
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map symbols
    "\U0001F1E0-\U0001F1FF"  # flags
    "\U00002702-\U000027B0"
    "\U000024C2-\U0001F251"
    "]+",
    flags=re.UNICODE
)

# URL pattern
URL_PATTERN = re.compile(
    r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
)


def get_sentiment(messages):
    score = 0

    for msg in messages:
        words = msg.lower().split()

        for word in words:
            if word in positive_words:
                score += 1
            elif word in negative_words:
                score -= 1

    if score > 0:
        mood = "Positive"
    elif score < 0:
        mood = "Negative"
    else:
        mood = "Neutral"

    return {"score": score, "mood": mood}


def get_top_words(messages):
    freq = {}

    for msg in messages:
        for word in msg.lower().split():
            # Filter out common stop words and short words
            if len(word) > 2 and word not in ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that', 'with', 'they', 'from', 'what', 'when', 'where', 'who', 'will']:
                freq[word] = freq.get(word, 0) + 1

    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)

    return sorted_words[:10]


def get_emoji_usage(messages):
    emoji_counts = Counter()

    for msg in messages:
        emojis = EMOJI_PATTERN.findall(msg)
        for emoji in emojis:
            emoji_counts[emoji] += 1

    return dict(emoji_counts.most_common(10))


def get_links_shared(messages):
    links = []

    for msg in messages:
        found_urls = URL_PATTERN.findall(msg)
        links.extend(found_urls)

    return list(set(links))  # Return unique links


def get_activity_timeline(messages):
    """Get message count by hour of day"""
    hour_counts = Counter()

    for msg in messages:
        # Try to extract time from message if it has time info
        # This is a simple implementation - could be enhanced with actual timestamp parsing
        hour_counts["Unknown"] += 1

    return dict(hour_counts)


def get_peak_hours(messages_with_time):
    """Get peak chatting hours from messages with timestamps"""
    hour_counts = Counter()

    for msg in messages_with_time:
        time_str = msg.get('time', '')
        if time_str:
            try:
                # Parse time format like "10:45 pm" or "10:45"
                time_str = time_str.lower().strip()
                if 'pm' in time_str or 'am' in time_str:
                    parts = time_str.replace('pm', '').replace('am', '').strip().split(':')
                else:
                    parts = time_str.split(':')

                if len(parts) >= 2:
                    hour = int(parts[0])
                    # Convert PM to 24-hour format
                    if 'pm' in time_str and hour != 12:
                        hour += 12
                    elif 'am' in time_str and hour == 12:
                        hour = 0
                    hour_counts[hour] += 1
            except (ValueError, IndexError):
                pass

    if not hour_counts:
        return {}

    peak_hour = hour_counts.most_common(1)[0][0]
    peak_count = hour_counts[peak_hour]

    # Format peak hour
    if peak_hour == 0:
        peak_hour_str = "12 AM"
    elif peak_hour < 12:
        peak_hour_str = f"{peak_hour} AM"
    elif peak_hour == 12:
        peak_hour_str = "12 PM"
    else:
        peak_hour_str = f"{peak_hour - 12} PM"

    return {
        "peak_hour": peak_hour_str,
        "peak_count": peak_count,
        "hourly_distribution": dict(hour_counts)
    }


def get_most_active_user(messages_with_sender):
    """Get the most active user in the chat"""
    sender_counts = Counter()

    for msg in messages_with_sender:
        sender = msg.get('sender', 'Unknown')
        sender_counts[sender] += 1

    if not sender_counts:
        return {"user": "Unknown", "message_count": 0}

    top_user = sender_counts.most_common(1)[0]
    return {
        "user": top_user[0],
        "message_count": top_user[1],
        "all_users": dict(sender_counts)
    }


def get_summary(messages, sentence_count=3):
    if not messages:
        return ''

    all_sentences = []

    for msg in messages:
        msg_words = get_top_words([msg])
        keywords = {word for word, _ in msg_words}

        sentences = [s.strip() for s in re.split(r'[.!?]+', msg) if len(s.strip()) > 10]

        for sent in sentences:
            score = sum(1 for kw in keywords if kw in sent.lower())
            all_sentences.append({
                'text': sent,
                'score': score,
                'length': len(sent)
            })

    all_sentences.sort(key=lambda x: (x['score'], x['length']), reverse=True)

    top = all_sentences[:sentence_count]
    result = '. '.join(s['text'] for s in top)

    return result + '.' if result else messages[0][:100]
