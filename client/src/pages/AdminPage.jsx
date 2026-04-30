import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000";

function AdminPage() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const [bookings, setBookings] = useState([]);

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
    const res = await fetch(`${API_URL}/admin/bookings`, {
      headers: {
        Authorization: token,
      },
    });

    const data = await res.json();
    setBookings(data);
  }

  async function changeStatus(id, status) {
    await fetch(`${API_URL}/admin/bookings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ status }),
    });

    loadBookings();
  }

  async function deleteBooking(id) {
    await fetch(`${API_URL}/admin/bookings/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: token,
      },
    });

    loadBookings();
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div className="container">
      <div className="top">
        <h1>Админ-панель</h1>
        <button onClick={logout}>Выйти</button>
      </div>

      <p>
        Администратор: <b>{user?.username}</b>
      </p>

      <button onClick={loadBookings}>Обновить список</button>

      {bookings.length === 0 ? (
        <p>Бронирований пока нет</p>
      ) : (
        <div className="list">
          {bookings.map((booking) => (
            <div className="booking" key={booking.id}>
              <h3>{booking.roomName}</h3>
              <p>Пользователь: {booking.username}</p>
              <p>Дата: {booking.date}</p>
              <p>Время: {booking.time}</p>
              <p>Длительность: {booking.duration} ч.</p>
              <p> Статус:
                  <span className={booking.status}>
                    {" "}
                    {booking.status}
                  </span>
                </p>
              <button onClick={() => changeStatus(booking.id, "active")}>
                Active
              </button>

              <button onClick={() => changeStatus(booking.id, "cancelled")}>
                Cancelled
              </button>

              <button
                className="danger"
                onClick={() => deleteBooking(booking.id)}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPage;