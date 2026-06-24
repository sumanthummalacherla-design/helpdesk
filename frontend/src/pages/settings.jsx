import API_BASE from '../config';
import React, { useEffect, useState } from "react";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("General");

  const [settings, setSettings] = useState({
    helpDeskName: "Help Desk Support",
    companyName: "Acme Inc.",
    timezone: "India (UTC+05:30)",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12 Hour",
    language: "English",
    allowCustomerTickets: true,
    emailNotifications: true,
    autoCloseTickets: false,
    autoCloseDays: 7,
    satisfactionSurvey: true,
  });

  const menuItems = [
    "General",
    "Users",
    "Roles & Permissions",
    "Ticket Categories",
    "Priorities",
    "SLA Rules",
    "Email Templates",
    "Integrations",
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        "https://helpdesk-roii.onrender.com/api/settings"
      );

      const data = await response.json();

      setSettings({
        helpDeskName:
          data.helpDeskName || "Help Desk Support",
        companyName:
          data.companyName || "Acme Inc.",
        timezone:
          data.timezone || "India (UTC+05:30)",
        dateFormat:
          data.dateFormat || "DD/MM/YYYY",
        timeFormat:
          data.timeFormat || "12 Hour",
        language:
          data.language || "English",
        allowCustomerTickets:
          data.allowCustomerTickets ?? true,
        emailNotifications:
          data.emailNotifications ?? true,
        autoCloseTickets:
          data.autoCloseTickets ?? false,
        autoCloseDays:
          data.autoCloseDays ?? 7,
        satisfactionSurvey:
          data.satisfactionSurvey ?? true,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]:
        name === "autoCloseDays"
          ? Number(value)
          : value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const saveSettings = async () => {
    try {
      const response = await fetch(
        "https://helpdesk-roii.onrender.com/api/settings",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Settings Saved Successfully");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save settings");
    }
  };

  return (
    <main
      style={{
        padding: "24px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: "700",
          marginBottom: "5px",
        }}
      >
        Settings
      </h1>

      <p
        style={{
          color: "#64748b",
          marginBottom: "24px",
        }}
      >
        Manage your help desk system settings and
        preferences.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 420px",
          gap: "20px",
        }}
      >
        {/* Sidebar */}

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "12px",
            height: "fit-content",
          }}
        >
          {menuItems.map((item) => (
            <div
              key={item}
              onClick={() =>
                setActiveTab(item)
              }
              style={{
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "6px",
                cursor: "pointer",
                background:
                  activeTab === item
                    ? "#eef2ff"
                    : "transparent",
                color:
                  activeTab === item
                    ? "#4f46e5"
                    : "#374151",
                fontWeight:
                  activeTab === item
                    ? "600"
                    : "500",
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* General Settings */}

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3
            style={{
              marginBottom: "20px",
            }}
          >
            General Settings
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>
                Help Desk Name
              </label>

              <input
                type="text"
                name="helpDeskName"
                value={
                  settings.helpDeskName
                }
                onChange={
                  handleInputChange
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Company Name
              </label>

              <input
                type="text"
                name="companyName"
                value={
                  settings.companyName
                }
                onChange={
                  handleInputChange
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Default Time Zone
              </label>

              <select
                name="timezone"
                value={
                  settings.timezone
                }
                onChange={
                  handleInputChange
                }
                style={inputStyle}
              >
                <option>
                  India (UTC+05:30)
                </option>

                <option>
                  US Eastern (UTC-05:00)
                </option>

                <option>
                  US Central (UTC-06:00)
                </option>

                <option>
                  US Mountain (UTC-07:00)
                </option>

                <option>
                  US Pacific (UTC-08:00)
                </option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Date Format
              </label>

              <select
                name="dateFormat"
                value={
                  settings.dateFormat
                }
                onChange={
                  handleInputChange
                }
                style={inputStyle}
              >
                <option>
                  DD/MM/YYYY
                </option>

                <option>
                  MM/DD/YYYY
                </option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Time Format
              </label>

              <select
                name="timeFormat"
                value={
                  settings.timeFormat
                }
                onChange={
                  handleInputChange
                }
                style={inputStyle}
              >
                <option>
                  12 Hour
                </option>

                <option>
                  24 Hour
                </option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Default Language
              </label>

              <select
                name="language"
                value={
                  settings.language
                }
                onChange={
                  handleInputChange
                }
                style={inputStyle}
              >
                <option>
                  English
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Preferences */}

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h3
            style={{
              marginBottom: "20px",
            }}
          >
            System Preferences
          </h3>

          <Preference
            name="allowCustomerTickets"
            checked={
              settings.allowCustomerTickets
            }
            onChange={
              handleCheckboxChange
            }
            label="Allow customers to create tickets"
          />

          <Preference
            name="emailNotifications"
            checked={
              settings.emailNotifications
            }
            onChange={
              handleCheckboxChange
            }
            label="Enable email notifications"
          />

          <Preference
            name="autoCloseTickets"
            checked={
              settings.autoCloseTickets
            }
            onChange={
              handleCheckboxChange
            }
            label="Auto close resolved tickets"
          />

          <div
            style={{
              marginLeft: "24px",
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              Close after days
            </label>

            <input
              type="number"
              min="1"
              max="365"
              name="autoCloseDays"
              value={
                settings.autoCloseDays
              }
              onChange={
                handleInputChange
              }
              style={{
                ...inputStyle,
                marginTop: "8px",
                width: "120px",
              }}
            />
          </div>

          <Preference
            name="satisfactionSurvey"
            checked={
              settings.satisfactionSurvey
            }
            onChange={
              handleCheckboxChange
            }
            label="Show satisfaction survey"
          />

          <button
            onClick={saveSettings}
            style={{
              width: "100%",
              height: "44px",
              border: "none",
              borderRadius: "8px",
              background: "#4f46e5",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </main>
  );
};

const Preference = ({
  name,
  checked,
  onChange,
  label,
}) => (
  <div
    style={{
      marginBottom: "18px",
    }}
  >
    <label>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />{" "}
      {label}
    </label>
  </div>
);

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "14px",
  color: "#475569",
  fontWeight: "500",
};

const inputStyle = {
  width: "100%",
  height: "42px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "14px",
};

export default Settings;

