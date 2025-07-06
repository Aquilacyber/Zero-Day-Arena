
from flask import Flask, render_template_string, request, send_file, abort
import os

app = Flask(__name__)

FLAG = "flag{steganography_is_easy}"
IMG_PATH = os.path.join(os.path.dirname(__file__), "hidden.jpg")

HTML = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Forensics Steganography Challenge</title>
    <style>
        body { background: #181c20; color: #f0f0f0; font-family: 'Inter', Arial, sans-serif; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        .container { background: #23272b; border-radius: 12px; box-shadow: 0 4px 24px #00ffff33; padding: 32px; margin-top: 48px; max-width: 420px; width: 100%; text-align: center; }
        h1 { color: #00ffff; margin-bottom: 12px; }
        .subtitle { color: #ff6f61; margin-bottom: 18px; }
        input { width: 100%; padding: 10px; border-radius: 8px; border: none; margin-bottom: 12px; background: #181c20; color: #f0f0f0; font-size: 1rem; }
        input[type=submit] { background: linear-gradient(90deg, #00ffff, #ff6f61); color: #181c20; font-weight: bold; cursor: pointer; transition: background 0.2s; border: none; border-radius: 8px; padding: 10px 18px; font-size: 1rem; margin-top: 6px; }
        input[type=submit]:hover { background: linear-gradient(90deg, #ff6f61, #00ffff); color: #0e0e0e; }
        .result { margin-top: 16px; padding: 12px; border-radius: 8px; background: #00ffcc22; color: #00ffcc; font-weight: bold; }
        .error { background: #ff6f6122; color: #ff6f61; }
        .hint { margin-top: 18px; color: #aaa; font-size: 0.98em; background: #181c20; border: 1px dashed #00ffff; border-radius: 8px; padding: 12px; }
        .download { margin-top: 22px; }
        a.download-link { color: #00ffff; text-decoration: underline; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🕵️‍♂️ Forensics Steganography</h1>
        <div class="subtitle">Can you extract the hidden flag from the image?</div>
        <form method="post">
            <input name="flag" placeholder="Enter the flag you found" required>
            <input type="submit" value="Verify Flag">
        </form>
        {% if result %}
            <div class="result{% if not success %} error{% endif %}">{{ result }}</div>
        {% endif %}
        <div class="hint">
            Download <b>hidden.jpg</b> and use any steganography tool or script (e.g., stepic, zsteg, or online LSB tools) to extract the flag.<br>
            The flag format is <b>flag&#123;steganography_is_easy&#125;</b>.<br>
            No need to upload or modify any image—just analyze the provided file!
        </div>
        <div class="download">
            <a href="/download/hidden.jpg" class="download-link" download>Download hidden.jpg</a>
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
        user_flag = request.form.get('flag', '').strip()
        if user_flag == FLAG:
            result = f"Correct! The flag is: {FLAG}"
            success = True
        else:
            result = "Incorrect flag. Try again!"
            success = False
    return render_template_string(HTML, result=result, success=success)

@app.route('/download/hidden.jpg')
def download_image():
    if os.path.exists(IMG_PATH):
        return send_file(IMG_PATH, as_attachment=True)
    else:
        abort(404)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5004)
