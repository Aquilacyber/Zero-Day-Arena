from secret_check import check_password

if __name__ == "__main__":
    password = input("Enter the password: ")
    if check_password(password):
        print("Congratulations! You found the flag.")
    else:
        print("Incorrect password.")