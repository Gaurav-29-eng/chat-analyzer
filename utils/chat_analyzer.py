import re

positive_words = ["happy", "good", "love", "great", "nice"]
negative_words = ["sad", "bad", "angry", "hate", "sorry"]


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
            freq[word] = freq.get(word, 0) + 1

    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)

    return sorted_words[:5]


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
