from flask import Flask, render_template_string, request
import os

app = Flask(__name__)

KEY = "supersecret"
MESSAGE = "flag{xor_is_lame}"

# Encrypt the message (for demo, not secure)
def xor_encrypt(msg, key):
    return ''.join([chr(ord(c) ^ ord(key[i % len(key)])) for i, c in enumerate(msg)])

def xor_decrypt(cipher, key):
    return ''.join([chr(ord(c) ^ ord(key[i % len(key)])) for i, c in enumerate(cipher)])

CIPHER = xor_encrypt(MESSAGE, KEY)

HTML = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>XOR Crypto Challenge</title>
    <style>
        body { background: #181c20; color: #f0f0f0; font-family: 'Inter', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .container { background: #23272b; border-radius: 12px; box-shadow: 0 4px 24px #00ffff33; padding: 32px; margin-top: 48px; max-width: 420px; width: 100%; text-align: center; }
        h1 { color: #00ffff; margin-bottom: 12px; }
        .cipher { font-family: monospace; background: #111; color: #ff6f61; padding: 8px 12px; border-radius: 6px; margin-bottom: 18px; display: inline-block; }
        input, textarea { width: 100%; padding: 10px; border-radius: 8px; border: none; margin-bottom: 12px; background: #181c20; color: #f0f0f0; font-size: 1rem; }
        input[type=submit], button.hint-btn { background: linear-gradient(90deg, #00ffff, #ff6f61); color: #181c20; font-weight: bold; cursor: pointer; transition: background 0.2s; border: none; border-radius: 8px; padding: 10px 18px; font-size: 1rem; margin-top: 6px;}
        input[type=submit]:hover, button.hint-btn:hover { background: linear-gradient(90deg, #ff6f61, #00ffff); color: #0e0e0e; }
        .result { margin-top: 16px; padding: 12px; border-radius: 8px; background: #00ffcc22; color: #00ffcc; font-weight: bold; }
        .error { background: #ff6f6122; color: #ff6f61; }
        .hint { margin-top: 18px; color: #aaa; font-size: 0.98em; background: #181c20; border: 1px dashed #00ffff; border-radius: 8px; padding: 12px; }
    </style>
    <script>
      function showHint() {
        document.getElementById('hint-box').style.display = 'block';
        document.getElementById('show-hint-btn').style.display = 'none';
      }
      function showSecondHint() {
        document.getElementById('second-hint-box').style.display = 'block';
        document.getElementById('show-second-hint-btn').style.display = 'none';
      }
    </script>
</head>
<body>
    <div class="container">
        <h1>🔐 XOR Crypto Challenge</h1>
        <p>Below is an encrypted message using a repeating-key XOR cipher.<br>Can you decrypt it?</p>
        <div class="cipher">{{ cipher_display }}</div>
        <form method="post">
            <input name="key" placeholder="Enter key to decrypt" required>
            <input type="submit" value="Decrypt">
        </form>
        {% if result %}
            <div class="result{% if not success %} error{% endif %}">{{ result }}</div>
        {% endif %}
        <button type="button" class="hint-btn" id="show-hint-btn" onclick="showHint()">Show Hint</button>
        <div id="hint-box" class="hint" style="display:none;">
            The flag format is <b>flag&#123;...&#125;</b>.<br>
            The key is a single English word, all lowercase, and is repeated to match the flag length.<br>
            Try XORing the first few bytes of the ciphertext with <code>flag&#123;</code> to deduce the start of the key!<br>
            <button type="button" class="hint-btn" id="show-second-hint-btn" onclick="showSecondHint()" style="margin-top:10px;">Show Riddle</button>
            <div id="second-hint-box" class="hint" style="display:none; margin-top:10px;">
                <b>Riddle:</b><br>
                I am the word that keeps things hidden,<br>
                I guard your vaults, your codes, your mind.<br>
                Without me, all is forbidden,<br>
                But say my name, and truth you'll find.<br>
                <i>What am I?</i>
            </div>
        </div>
    </div>
</body>
</html>
'''

@app.route('/', methods=['GET', 'POST'])
def index():
    result = ''
    success = False
    if request.method == 'POST':
        user_key = request.form.get('key', '')
        try:
            decrypted = xor_decrypt(CIPHER, user_key)
            # Only show success if the flag is printable and matches the expected format
            if decrypted.startswith('flag{') and decrypted.endswith('}'):
                result = f"Success! The flag is: {decrypted}"
                success = True
            else:
                result = f"Decryption result: {decrypted}"
                success = False
        except Exception as e:
            result = f"Error: {e}"
            success = False
    # Show the cipher as hex for web display
    cipher_display = ' '.join(f'{ord(c):02x}' for c in CIPHER)
    return render_template_string(HTML, cipher_display=cipher_display, result=result, success=success)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
