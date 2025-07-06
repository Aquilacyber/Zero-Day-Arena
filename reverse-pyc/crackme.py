from flask import Flask, render_template_string, request
import hashlib
import os
import importlib.util
import sys

app = Flask(__name__)

FLAG = "flag{reverse_engineered_me}"
# SHA-256 hash of 'hunter2'
PASSWORD_HASH = 'f52fbd32b2b3b86ff88ef6c490628285f482af15ddcb29541f94bcf526a3f6c7'

HTML = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Reverse Engineering CrackMe</title>
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
    </style>
</head>
<body>
    <div class="container">
        <h1>🕵️‍♂️ CrackMe Reverse Engineering</h1>
        <div class="subtitle">Your task is to find the correct password to unlock the flag.<br>Hint: The password is a very popular internet meme password.</div>
        <form method="post">
            <input name="password" placeholder="Enter password" required>
            <input type="submit" value="Submit">
        </form>
        {% if result %}
            <div class="result{% if not success %} error{% endif %}">{{ result }}</div>
        {% endif %}
        <div class="hint">The password check logic is hidden in an obfuscated <b>.pyc</b> file.<br>
        Download it below and reverse engineer the <b>secret_check.cpython-311.pyc</b> file to find the correct password!</div>
        <div style="margin-top:22px;">
            <a href="/download/secret_check.cpython-311.pyc" download style="color:#00ffff;text-decoration:underline;font-weight:bold;">Download the obfuscated password check (.pyc)</a>
            <div style="color:#aaa;font-size:0.93em;margin-top:4px;">Use this file for your reverse engineering analysis.</div>
        </div>
    </div>
</body>
</html>
'''

def get_pyc_bytes():
    pyc_path = os.path.join(os.path.dirname(__file__), 'secret_check.cpython-311.pyc')
    with open(pyc_path, 'rb') as f:
        return f.read()

def check_password(pw):

    pyc_path = os.path.join(os.path.dirname(__file__), 'secret_check.cpython-311.pyc')
    spec = importlib.util.spec_from_file_location('secret_check', pyc_path)
    secret_check = importlib.util.module_from_spec(spec)
    sys.modules['secret_check'] = secret_check
    spec.loader.exec_module(secret_check)
    return secret_check.check_password(pw)


@app.route('/', methods=['GET', 'POST'])
def index():
    result = ''
    success = False
    if request.method == 'POST':
        user_pw = request.form.get('password', '')
        if check_password(user_pw):
            result = f"Success! The flag is: {FLAG}"
            success = True
        else:
            result = "Wrong password. Keep trying!"
            success = False
    return render_template_string(HTML, result=result, success=success)

# Route to download the .pyc file for reverse engineering
@app.route('/download/secret_check.cpython-311.pyc')
def download_pyc():
    from flask import send_file, abort
    import os
    pyc_path = os.path.join(os.path.dirname(__file__), 'secret_check.cpython-311.pyc')
    if os.path.exists(pyc_path):
        return send_file(pyc_path, as_attachment=True)
    else:
        abort(404)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5003)
