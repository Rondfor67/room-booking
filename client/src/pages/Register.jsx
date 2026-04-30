import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  async function register(e) {
    e.preventDefault();

    if (!form.username || !form.phone || !form.password) {
  setMessage("Заполните все поля");
  return;
}

if (!/^[a-zA-Z0-9]+$/.test(form.username)) {
  setMessage("Логин должен содержать только буквы и цифры");
  return;
}

if (!/^\+?[0-9]+$/.test(form.phone)) {
  setMessage("Телефон должен содержать только цифры");
  return;
}

if (
  form.password.length < 6 ||
  !/[A-Z]/.test(form.password) ||
  !/[0-9]/.test(form.password)
) {
  setMessage(
    "Пароль должен содержать минимум 6 символов, 1 заглавную букву и 1 цифру"
  );
  return;
}

    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setMessage(data.message);

    if (res.ok) {
      setForm({
        username: "",
        phone: "",
        password: "",
      });

      setTimeout(() => {
        navigate("/");
      }, 1000);
    }
  }

  return (
    <div className="center">
      <form className="card" onSubmit={register}>
        <h1>Регистрация</h1>

        <input
          type="text"
          placeholder="Логин"
          maxLength="20"
          value={form.username}
          onChange={(e) =>
            setForm({
              ...form,
              username: e.target.value,
            })
          }
        />

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
          minLength="6"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
        />

        <button>Зарегистрироваться</button>

        {message && <p className="message">{message}</p>}

        <div className="rules">
          <p>Условия регистрации:</p>
          <ul>
            <li>Логин: только буквы и цифры</li>
            <li>Телефон: только цифры</li>
            <li>Пароль: минимум 6 символов</li>
            <li>В пароле должна быть 1 заглавная буква</li>
            <li>В пароле должна быть 1 цифра</li>
          </ul>
        </div>

        <p>
          Уже есть аккаунт? <Link to="/">Войти</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;