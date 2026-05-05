import os
import hashlib
import base64
import piexif

# Minimal valid 1x1 JPEG (base64-encoded) — used as the base for EXIF injection
MINIMAL_JPEG_B64 = (
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof"
    "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAAB"
    "AAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8Ae0AB/9k="
)


def main():
    print("[*] Phantom Insider — Generating digital footprint...")

    # Fetch dynamic flags from environment
    flag1 = os.environ.get('FLAG_ONE')
    flag2 = os.environ.get('FLAG_TWO')
    flag3 = os.environ.get('FLAG_THREE')

    out_dir = "/usr/share/nginx/html"
    os.makedirs(out_dir, exist_ok=True)

    # ── Flag 1: Secret Employee Profile ────────────────────────
    print("[*] Generating Employee Profile (Flag 1)...")
    profile_html = f"""<!DOCTYPE html>
<html>
<head><title>Employee Profile: E-8931</title></head>
<body style="font-family: monospace; background: #222; color: #0f0; margin: 50px;">
    <h2>NexaCorp Internal Directory - Profile Match</h2>
    <p><strong>Name:</strong> Michael Vance</p>
    <p><strong>Department:</strong> Sales</p>
    <p><strong>Title:</strong> Account Executive</p>
    <p><strong>Status:</strong> <span style="color:#f00;">SUSPECT IDENTIFIED</span></p>
    <hr>
    <h3>Identity confirmed. First flag recovered!</h3>
    <p style="background: #000; padding: 10px; border: 1px solid #0f0; display: inline-block;">{flag1}</p>
</body>
</html>"""
    with open(os.path.join(out_dir, "E-8931.html"), "w", encoding="utf-8") as f:
        f.write(profile_html)

    # ── Flag 2: EXIF-injected Image ────────────────────────────
    print("[*] Generating EXIF Image (Flag 2)...")
    img_path = os.path.join(out_dir, "meetup_spot.jpg")

    # Write the minimal JPEG from embedded base64
    with open(img_path, 'wb') as f:
        f.write(base64.b64decode(MINIMAL_JPEG_B64))

    # Inject Flag 2 into EXIF fields
    exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}
    exif_dict["0th"][piexif.ImageIFD.ImageDescription] = flag2.encode('utf-8')
    # UserComment format: 8-byte charset prefix + text
    user_comment = b'ASCII\x00\x00\x00' + flag2.encode('utf-8')
    exif_dict["Exif"][piexif.ExifIFD.UserComment] = user_comment

    exif_bytes = piexif.dump(exif_dict)
    piexif.insert(exif_bytes, img_path)

    # ── Flag 3: Breach Dump + Encrypted ZIP ────────────────────
    print("[*] Generating Breach Dump and Encrypted ZIP (Flag 3)...")
    crackable_pass = "liverpool123"
    hashed_pass = hashlib.md5(crackable_pass.encode('utf-8')).hexdigest()

    dump_content = f"""darkweb_breach_repo_2024
format: username:md5_hash

johndoe:{hashlib.md5(b"password").hexdigest()}
alice21:{hashlib.md5(b"qwerty").hexdigest()}
wraith_99:{hashed_pass}
bigboss:{hashlib.md5(b"admin123").hexdigest()}
cyberninja:{hashlib.md5(b"iloveninjas").hexdigest()}
"""
    with open(os.path.join(out_dir, "breach_dump_2024.txt"), "w") as f:
        f.write(dump_content)

    # Create the flag file and zip it with password protection
    flag_txt_path = "/tmp/flag3.txt"
    with open(flag_txt_path, "w") as f:
        f.write(f"Excellent work. You cracked the hash and extracted the archive.\nFinal Flag: {flag3}\n")

    zip_path = os.path.join(out_dir, "stolen_data.zip")
    os.system(f"cd /tmp && zip -P {crackable_pass} {zip_path} flag3.txt")

    # ── Copy static HTML assets into web root ──────────────────
    print("[*] Copying static assets...")
    os.system("cp -r /opt/assets/* /usr/share/nginx/html/ 2>/dev/null || true")

    print("[+] Phantom Insider footprint generation complete!")


if __name__ == "__main__":
    main()
