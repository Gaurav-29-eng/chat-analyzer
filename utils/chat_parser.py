import re


# WhatsApp: dd/mm/yy, hh:mm - name: msg
WHATSAPP_PATTERN = r"(\d{1,2}/\d{1,2}/\d{2,4}), (\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*-\s*(.*?):\s*(.*)"

# System messages to ignore
SYSTEM_KEYWORDS = [
    "messages and calls are end-to-end encrypted",
    "changed the subject",
    "changed this group's icon",
    "added",
    "removed",
    "left",
    "joined",
    "created group",
    "pinned a message"
]


def is_system_message(sender, message):
    """Check if message is a system notification."""
    full_text = (sender + " " + message).lower()
    return any(keyword in full_text for keyword in SYSTEM_KEYWORDS)


def parse_messages(chat_text):
    """
    Parse chat text into structured messages.
    Supports WhatsApp format with multiline messages.
    """
    messages = []
    current_msg = None

    for line in chat_text.split("\n"):
        line = line.strip()
        if not line:
            continue

        # Check if line starts a new message
        match = re.match(WHATSAPP_PATTERN, line)

        if match:
            # Save previous message if exists
            if current_msg:
                messages.append(current_msg)

            date, time, sender, message = match.groups()

            # Skip system messages
            if is_system_message(sender, message):
                current_msg = None
                continue

            current_msg = {
                "sender": sender.strip(),
                "message": message.strip(),
                "time": time.strip()
            }
        elif current_msg:
            # Multiline message - append to previous
            current_msg["message"] += "\n" + line

    # Don't forget the last message
    if current_msg:
        messages.append(current_msg)

    return messages
