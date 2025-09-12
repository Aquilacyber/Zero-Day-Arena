# Source Generated with Decompyle++
# File: secret_check.cpython-311.pyc (Python 3.11)

import hashlib

def check_password(pw):
    return hashlib.sha256(pw.encode()).hexdigest() == 'f52fbd32b2b3b86ff88ef6c490628285f482af15ddcb29541f94bcf526a3f6c7'

