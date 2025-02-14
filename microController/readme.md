# PLEASE modify the microcontroller code before use 
## Although the uf2 CAN be uploaded directly and WILL work, for your own safety consider the following:

### - 1. setup the arduino ide with the right board manager for your micro-controller.
### - 2. load the [sketch](./arduino/controlMouse.ino) into the ide, verify external libraries valid.
### - 3. change the network STASSID / STAPSK ie: name / password  (techincally optional, highly recommended).
### - 4. (optional) uncomment WiFi.mode(WIFI_STA) AND comment out WiFi.mode(WIFI_AP); for exsting wlan connection.
### - 5. (very optional) comment out the debugging serial.println and serial.begin lines if kernel anticheat scans serial ports (unlikely)
### - 6. flash the pico through arduino ide upload button or exported binary (uf2).
### - 7. request the right ip (192.168.42.1 in sta mode) otherwise, you'll need to find the ip your dhcp server (router) assigns.

## Note that the mouse-controller portion of this program is currently served over http (unsecure) DO NOT PORTFORWARD!
for this project, there should be no reason to portforward the pi pico EVER (this is when connected to existing wlan, in AP mode you wont be able to portforward anyways)
