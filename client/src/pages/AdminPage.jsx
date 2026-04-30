import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000";

function AdminPage() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");

  useEffect(() => {
    if (!token || !user) {
      navigate("/");
      return;
    }

    if (user.role !== "admin") {
      navigate("/user");
      return;
    }

    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/admin/bookings`, {
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
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id, status) {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Статус обновлён");
      loadBookings();
    } catch {
      setMessage("Ошибка при изменении статуса");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBooking(id) {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/admin/bookings/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message);
        return;
      }

      setMessage("Бронирование удалено");
      loadBookings();
    } catch {
      setMessage("Ошибка при удалении бронирования");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const filteredBookings = bookings
    .filter((booking) =>
      booking.roomName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "date") {
        return new Date(a.date) - new Date(b.date);
      }

      if (sort === "time") {
        return a.time.localeCompare(b.time);
      }

      if (sort === "duration") {
        return Number(a.duration) - Number(b.duration);
      }

      return 0;
    });

  return (
    <div className="container">
      <div className="top">
        <div>
          <h1>Админ-панель</h1>
          <p>Просмотр и управление всеми бронированиями</p>
        </div>

        <button onClick={logout}>Выйти</button>
      </div>

      <div className="user-info">
        Администратор: <b>{user?.username}</b>
      </div>

      {message && <p className="message">{message}</p>}

      <div className="admin-panel">
        <div className="admin-header">
          <h2>Все бронирования</h2>

          <button onClick={loadBookings} disabled={loading}>
            {loading ? "Загрузка..." : "Обновить список"}
          </button>
        </div>

        <div className="controls">
          <input
            type="text"
            placeholder="Поиск по комнате"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date">Сортировка по дате</option>
            <option value="time">Сортировка по времени</option>
            <option value="duration">Сортировка по длительности</option>
          </select>
        </div>

        {loading && <p className="loading">Загрузка данных...</p>}

        {!loading && filteredBookings.length === 0 ? (
          <div className="empty">Бронирований не найдено</div>
        ) : (
          <div className="list">
            {filteredBookings.map((booking) => (
              <div className="booking" key={booking.id}>
                <h3>{booking.roomName}</h3>

                <p>Пользователь: {booking.username}</p>
                <p>Дата: {booking.date}</p>
                <p>Время: {booking.time}</p>
                <p>Длительность: {booking.duration} ч.</p>

                <p>
                  Статус:{" "}
                  <span className={booking.status}>{booking.status}</span>
                </p>

                <div className="booking-actions">
                  <button
                    onClick={() => changeStatus(booking.id, "active")}
                    disabled={loading}
                  >
                    Active
                  </button>

                  <button
                    onClick={() => changeStatus(booking.id, "cancelled")}
                    disabled={loading}
                  >
                    Cancelled
                  </button>

                  <button
                    className="danger"
                    onClick={() => deleteBooking(booking.id)}
                    disabled={loading}
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
  );
}

export default AdminPage;