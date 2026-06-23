# 🛡️ WarrantyWallet

**Your Digital Warranty Manager** — Store, track, and manage all your product warranties in one place. Never miss an expiry date again.[reference:2]

![WarrantyWallet Demo](https://digital-warranty-wallet.vercel.app/)

(https://img.shields.io/badge/Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://digital-warranty-wallet.vercel.app/)
(https://youtu.be/Hhpm2Qck4_8)
[![GitHub Repo](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kanishka-wani/warranty-wallet)

---

## 🌟 Why WarrantyWallet?

> *"Every year, millions of people lose track of their product warranties, missing out on free repairs and replacements. WarrantyWallet was built to solve this problem — a simple, secure, and beautiful way to store all your warranty information in one place."*

WarrantyWallet isn't just another CRUD app. It's a **digital companion** for your valuable purchases — from smartphones and laptops to home appliances. It gives you:

- **Peace of Mind** — Never miss a warranty expiry again.
- **Complete Control** — Upload product images, store invoices, and track every detail.
- **User‑First Design** — Clean, dark‑themed UI with seamless authentication and real‑time notifications.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **User Authentication** | Sign up / Sign in with email & password. Each user gets their own private warranty vault. |
| 📦 **Product Management** | Add, view, edit, and delete products with warranty details (purchase date, duration, retailer, etc.). |
| 🖼️ **Image Uploads** | Upload product images and invoices. Images are stored as base64 and displayed on cards and detail modals. |
| 📊 **Dashboard & Analytics** | Beautiful dashboard with stats: Total Products, Active Warranties, Expiring Soon, and Expired. |
| 🔔 **Smart Notifications** | Automatic alerts for warranties expiring within 30 days (with urgency levels). |
| 🔍 **Live Search** | Real‑time search across product names and brands. |
| 📄 **Invoice Export** | Download invoice images directly from the product detail view. |
| 🎨 **Modern UI** | Dark theme with orange/teal accents, smooth animations, and responsive design. |
| 💾 **Local Storage** | All data is stored securely in your browser's LocalStorage — no server required. |

---

## 🚀 Live Demo

**👉 [digital-warranty-wallet.vercel.app](https://digital-warranty-wallet.vercel.app/)**

Try it out:
1. **Register** a new account.
2. **Add** your first product with warranty details.
3. **Upload** product and invoice images.
4. **View** your dashboard and notifications.
5. **Download** invoices with one click.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6) |
| **Styling** | Custom CSS with CSS Variables, Flexbox, Grid, Animations |
| **Icons** | Font Awesome 6 |
| **Fonts** | Google Fonts (Inter) |
| **Storage** | LocalStorage (user‑specific keys: `warrantyProducts_<email>`) |
| **Authentication** | Custom JWT‑less auth (email/password stored in LocalStorage) |
| **Deployment** | [Vercel](https://vercel.com) |

---

## 📁 Project Structure
```
warranty-wallet/
├── index.html
├── products.html
├── add.html
├── about.html
├── styles.css 
├── script.js
└── README.md
```
---

## 🔧 Installation & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/kanishka-wani/warranty-wallet.git

# 2. Navigate to the project folder
cd warranty-wallet

# 3. Open in your browser (no build step required!)
open index.html
# or use Live Server in VS Code
```
--- 

## 🧠 How It Works
---

### 1. Authentication
**Sign Up** — Create an account with name, email, and password.

**Sign In** — Log in with email & password.

**Session** — User data is stored in localStorage under warrantyUser.

**Protected Routes** — products.html and add.html are fully blocked when not logged in (full‑page overlay).

### 2. Product Storage
Each user's products are stored under a unique key: warrantyProducts_<email>.

Products include: name, brand, retailer, purchase date, warranty period (months/years), product image (base64), invoice image (base64).

### 3. Smart Notifications
Calculates days left until warranty expiry.

Alerts for warranties expiring within 30 days (🟡 "Soon") and within 7 days (🔴 "Urgent").

Expired warranties are flagged with a red badge.

### 4. Invoice Export
When viewing a product, if an invoice was uploaded, a "Download Invoice" button appears.

Downloads the invoice image with a filename like ProductName_invoice_2026-06-23.png.

---

## 🤝 Contributing
Contributions are welcome! If you'd like to improve WarrantyWallet:

Fork the repository.

Create a feature branch (git checkout -b feature/amazing-feature).

Commit your changes (git commit -m 'Add some amazing feature').

Push to the branch (git push origin feature/amazing-feature).

Open a Pull Request.

---

## 📄 License
This project is open‑source and available under the MIT License.

---

## 🙏 Acknowledgements
Font Awesome for the beautiful icons.

Google Fonts for the Inter typeface.

Unsplash for placeholder images .

Vercel for effortless deployment.

---

## 📬 Contact
Kanishka Wani — Founder & Developer


Built with ❤️ to make warranty management effortless.



---

