# steps to build:

### 1. setup the arduino ide with the right board manager for your micro-controller.

### 2. load the [sketch](/microController/controlMouse.ino) into the ide, verify external libraries valid.

### 3. (techincally optional, highly recommended) change the network STASSID / STAPSK ie: name / password.

### 4. (optional) uncomment WiFi.mode(WIFI_STA) AND comment out WiFi.mode(WIFI_AP); for exsting wlan connection.

### 5. (very optional) comment out the debugging serial.println and serial.begin lines if kernel anticheat scans serial ports (unlikely).

### 6. flash the pico through arduino ide upload button or prebuilt executable (uf2).

### 7. request the right ip (192.168.42.1 in sta mode) otherwise, you'll need to find the ip your dhcp server (router) assigns.

# modes:

|              | **Absolute Mouse** | **Relative Mouse** |
| ------------ | ------------------ | ------------------ |
| **AP Mode**  | **AP + Absolute**  | **AP + Relative**  |
| **STA Mode** | **STA + Absolute** | **STA + Relative** |

**Absolute Mode:**
- #### positions cursor absolutely to (x,y) (pixel or map to some pixel bound)

**Relative Mode:**
- #### positions mouse relatively to (+/-x,+/-y) (relative to previous cursor position)

**AP Mode:**
- #### Network option to open a wireless access point (you will need to join this network default pi-net-aim)

**STA Mode (HARD):** 
- #### Network option to use an existing wlan (your dhcp should then assign a local ip)


# WARNINGS:

## please modify the microcontroller code before use

## Although the uf2 CAN be uploaded directly and WILL work, for your own safety consider the following:

## LAN acess has to be enabled browser side for the request to go through.

## only way to reset right now is command/ctrl + r to refresh page (sorry...).

## if you use the default relative positioning, absolute positioning for 2d wont work without recompiling (SEE .ino)

## Note that the mouse-controller portion of this program is currently served over http (unsecure) DO NOT PORTFORWARD!

## for this project, there should be no reason to portforward the pi pico EVER (this is when connected to existing wlan, in AP mode you wont be able to portforward anyways)
