import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = "http://localhost:3000";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    phone: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  async function login(e) {
    e.preventDefault();

    if (!form.phone || !form.password) {
  setMessage("Заполните все поля");
  return;
}

if (!/^\+?[0-9]+$/.test(form.phone)) {
  setMessage("Телефон должен содержать только цифры");
  return;
}

    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (data.user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/user");
    }
  }

  return (
    <div className="center">
      <form className="card" onSubmit={login}>
        <h1>Вход</h1>

        <input
          type="text"
          placeholder="Номер телефона"
          maxLength="15"
          value={form.phone}
          onChange={(e) =>
            setForm({
              ...form,
              phone: e.target.value,
            })
          }
        />

        <input
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
        />

        <button>Войти</button>

        {message && <p className="message">{message}</p>}

        <p>
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;