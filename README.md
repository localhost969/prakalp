# IoT Based Patient Health Monitoring System - PRAKALP-2025

## Project Overview

This project demonstrates a simple system for monitoring basic health signs remotely using an Internet of Things (IoT) approach. We use an ESP32 microcontroller connected to sensors (temperature, humidity, heart rate) to collect data. This data is then sent over the internet and displayed on this web dashboard.

**Goal:** To provide a user-friendly way to view real-time and historical health data from anywhere with an internet connection. This is particularly useful for monitoring patients, the elderly, or individuals in remote locations.

## How the Website Works

1.  **Data Collection:** The ESP32 device reads temperature, humidity, and heart rate from the sensors.
2.  **Data Transmission:** The device sends this data to a cloud server.
3.  **Data Display:** This website fetches the latest data from the server and displays it.
    *   **Dashboard:** Shows the most recent readings, trends over time in a graph, and a log of past readings.
    *   **Alerts:** The system highlights abnormal readings (e.g., high temperature) and provides simple recommendations.
    *   **Voice Assistant (Optional):** Can announce the current status and alerts.
    *   **About:** Provides details about the project and the team.

## Key Features

*   **Real-time Monitoring:** See the latest health data as it comes in.
*   **Visual Trends:** Understand patterns with an easy-to-read graph.
*   **Data History:** Look back at previous readings in a table.
*   **Status Indicators:** Quickly see if readings are normal, high, or low using color codes.
*   **Simple Recommendations:** Get basic suggestions based on the data.
*   **Remote Access:** Check the dashboard from any web browser.

## Simple Q&A

**Q: What problem does this solve?**
A: It allows for remote monitoring of basic health indicators without needing to be physically present, making healthcare more accessible and proactive, especially for those in remote areas or needing continuous observation.

**Q: How does the data get from the person to the website?**
A: Small sensors (like a thermometer and heart rate monitor) are connected to a tiny computer (ESP32). This computer reads the sensor data and uses Wi-Fi to send it over the internet to a central server. The website then fetches and displays this data from the server.

**Q: What specific health signs does it monitor?**
A: Currently, it monitors body temperature, heart rate (pulse), and the humidity of the surrounding environment (which can affect comfort and breathing).

**Q: Is this device worn by the patient?**
A: The sensors need to be in contact with or very close to the patient (e.g., temperature sensor on the skin, heart rate sensor on a fingertip). The ESP32 unit itself can be nearby.

**Q: How accurate are the sensors?**
A: The sensors used (DHT11, Pulse Sensor) are common for hobbyist projects and provide a good indication of trends. For clinical use, medical-grade certified sensors would be necessary for higher accuracy and reliability.

**Q: What is an ESP32?**
A: It's a small, low-cost, low-power computer chip with built-in Wi-Fi and Bluetooth. It's popular for IoT projects because it can connect sensors to the internet easily.

**Q: What does "IoT" mean?**
A: IoT stands for "Internet of Things." It refers to connecting everyday physical objects (like sensors, appliances, or devices) to the internet, allowing them to send and receive data.

**Q: How often is the data updated on the website?**
A: The website automatically refreshes the data every 60 seconds to show the latest readings sent by the device.

**Q: What do the colors (red, yellow, green) mean on the dashboard?**
A: They indicate the status of the readings: Green means normal, Yellow indicates a reading slightly outside the normal range (caution), and Red signifies a potentially critical reading (high or low alert).

**Q: Can multiple patients be monitored?**
A: This current prototype is designed for one sensor unit/patient. Scaling it for multiple patients would require modifications to how data is sent, stored, and displayed (e.g., identifying which data belongs to which patient).

**Q: What happens if the Wi-Fi connection is lost?**
A: If the ESP32 device loses its Wi-Fi connection, it cannot send new data to the server. The website will show the last received data until the connection is restored. The device could potentially store some readings locally and send them later, but that's not implemented in this version.

**Q: Is this data secure?**
A: For this hackathon prototype, we focused on demonstrating the concept. In a real-world medical application, strong security measures (like data encryption and secure authentication) would be absolutely essential to protect sensitive patient information.

**Q: Can this system predict health problems?**
A: It doesn't predict future problems, but it can help in early detection by showing trends or sudden changes in vital signs that might indicate an issue requiring medical attention.

**Q: Can this replace a doctor or nurse?**
A: Absolutely not. This is a monitoring tool to provide supplementary information. It cannot diagnose conditions or replace the judgment and care of trained healthcare professionals.

**Q: What are the main components needed?**
A: 1) The sensor unit (ESP32 chip, temperature sensor, heart rate sensor, humidity sensor, power source). 2) A Wi-Fi network with internet access. 3) The cloud server (to receive and store data). 4) This web dashboard (to view the data).

**Q: How is the website built?**
A: It's built using modern web technologies: Next.js (a framework based on React) for the user interface, Chart.js for displaying graphs, and standard HTML/CSS for structure and styling.

**Q: What do the "Recommendations" mean?**
A: These are simple, automated suggestions based on the current readings (e.g., "High temperature detected. Monitor for fever symptoms."). They are basic guidelines and not medical advice.

**Q: Can the voice assistant be turned off?**
A: Yes, there's a toggle switch on the dashboard to enable or disable the voice announcements.

**Q: What are the limitations of this prototype?**
A: Key limitations include the use of non-medical grade sensors, basic security, monitoring only a few vital signs, and not being designed for multiple users simultaneously. It's a proof-of-concept.

**Q: What could be future improvements?**
A: Adding more sensors (e.g., blood oxygen, fall detection), using certified medical sensors, enhancing security, developing mobile alerts, integrating with electronic health records, and improving the user interface.

**Q: How much would a system like this cost?**
A: The hardware components for this prototype (ESP32, sensors) are relatively inexpensive . The main costs in a real product would be in software development, ensuring reliability, security, certifications, and server maintenance (whole project made under 1500 INR).

---
*This project was developed for the PRAKALP-2025 hackathon.*
