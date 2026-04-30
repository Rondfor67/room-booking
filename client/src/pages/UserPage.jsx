import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000";

function UserPage() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    roomName: "",
    date: "",
    time: "",
    duration: "",
  });

  useEffect(() => {
    if (!token || !user) {
      navigate("/");
      return;
    }

    if (user.role !== "user") {
      navigate("/admin");
      return;
    }

    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        headers: {
          Authorization: token,
        },
      });

      if (!res.ok) {
        setMessage("Ошибка загрузки бронирований");
        return;
      }

      const data = await res.json();
      setBookings(data);
    } catch {
      setMessage("Сервер недоступен");
    }
  }

  async function createBooking(e) {
    e.preventDefault();

    if (!form.roomName || !form.date || !form.time || !form.duration) {
      setMessage("Заполните все поля");
      return;
    }

    if (form.duration > 8) {
    setMessage("Максимальная длительность — 8 часов");
    return;
    }

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Бронирование создано");

      setForm({
        roomName: "",
        date: "",
        time: "",
        duration: "",
      });

      loadBookings();
    } catch {
      setMessage("Ошибка сервера");
    }
  }

  async function cancelBooking(id) {
    try {
      await fetch(`${API_URL}/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      loadBookings();
    } catch {
      setMessage("Ошибка при отмене бронирования");
    }
  }

  async function deleteBooking(id) {
    try {
      await fetch(`${API_URL}/bookings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      loadBookings();
    } catch {
      setMessage("Ошибка при удалении бронирования");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div className="container">
      <div className="top">
        <div>
          <h1>Мои бронирования</h1>
          <p>Создание и управление бронированиями комнат</p>
        </div>

        <button onClick={logout}>Выйти</button>
      </div>

      <div className="user-info">
        Пользователь: <b>{user?.username}</b>
      </div>

      {message && <p className="message">{message}</p>}

      <div className="page-grid">
        <form className="card" onSubmit={createBooking}>
          <h2>Создать бронирование</h2>

          <select
  value={form.roomName}
  onChange={(e) => setForm({ ...form, roomName: e.target.value })}
>
  <option value="">Выберите комнату</option>
      <option value="Большая комната на 20 мест">
        Большая комната на 20 мест
      </option>
      <option value="Большая комната на 20 мест">
        Большая комната на 20 мест с проектором
      </option>
      <option value="Маленькая комната на 5 мест">
        Маленькая комната на 5 мест
      </option>
      <option value="Маленькая комната на 5 мест с проектором">
        Маленькая комната на 5 мест с проектором
      </option>
      <option value="Средняя комната на 10 мест">
        Средняя комната на 10 мест
      </option>
      <option value="Конференц-зал на 30 мест">
        Конференц-зал на 30 мест
      </option>
    </select>

          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />

          <input
            type="number"
            placeholder="Длительность в часах"
            min="1"
            max="8"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />

          <button>Создать</button>
        </form>

        <div>
          <h2>Список бронирований</h2>

          {bookings.length === 0 ? (
            <div className="empty">Пока нет бронирований</div>
          ) : (
            <div className="list">
              {bookings.map((booking) => (
                <div className="booking" key={booking.id}>
                  <h3>{booking.roomName}</h3>

                  <p>Дата: {booking.date}</p>
                  <p>Время: {booking.time}</p>
                  <p>Длительность: {booking.duration} ч.</p>

                  <p>
                    Статус:{" "}
                    <span className={booking.status}>{booking.status}</span>
                  </p>

                  <div className="booking-actions">

                    <button
                      className="danger"
                      onClick={() => deleteBooking(booking.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserPage;