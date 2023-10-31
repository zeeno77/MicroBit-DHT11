/*
 * MakeCode editor extension for DHT11 humidity/temperature sensor
 * by JP
 */


enum dataType {
    //% block="humedad"
    humedad,
    //% block="temperatura"
    temperatura,
}

//% block="Humedad y Temperatura" weight=100 color=#ff8f3f icon="\uf043"
namespace dht11 {

    let _temperature: number = -999.0
    let _humidity: number = -999.0
    let _readSuccessful: boolean = false
    let _sensorresponding: boolean = false

    /**
    * Consulta los datos del sensor DHT11 
    */
    //% block="consultarSensor Pin $dataPin|Tipo $tipo"
    export function consultarSensor(dataPin: DigitalPin, tipo: dataType): number {

        //initialize
        let startTime: number = 0
        let endTime: number = 0
        let checksum: number = 0
        let checksumTmp: number = 0
        let dataArray: boolean[] = []
        let resultArray: number[] = []

        for (let index = 0; index < 40; index++) dataArray.push(false)
        for (let index = 0; index < 5; index++) resultArray.push(0)

        _humidity = -999.0
        _temperature = -999.0
        _readSuccessful = false
        _sensorresponding = false
        startTime = input.runningTimeMicros()

        //request data
        pins.digitalWritePin(dataPin, 0) //begin protocol, pull down pin
        basic.pause(18)
        
        pins.setPull(dataPin, PinPullMode.PullUp) //pull up data pin if needed
        pins.digitalReadPin(dataPin) //pull up pin
        control.waitMicros(40)
        
        if (pins.digitalReadPin(dataPin) != 1) {
            _sensorresponding = true
            while (pins.digitalReadPin(dataPin) == 0); //sensor response
            while (pins.digitalReadPin(dataPin) == 1); //sensor response
            //read data (5 bytes)
            for (let index = 0; index < 40; index++) {
                while (pins.digitalReadPin(dataPin) == 1);
                while (pins.digitalReadPin(dataPin) == 0);
                control.waitMicros(28)
                //if sensor still pull up data pin after 28 us it means 1, otherwise 0
                if (pins.digitalReadPin(dataPin) == 1) dataArray[index] = true
            }

            endTime = input.runningTimeMicros()

            //convert byte number array to integer
            for (let index = 0; index < 5; index++)
                for (let index2 = 0; index2 < 8; index2++)
                    if (dataArray[8 * index + index2]) resultArray[index] += 2 ** (7 - index2)

            //verify checksum
            checksumTmp = resultArray[0] + resultArray[1] + resultArray[2] + resultArray[3]
            checksum = resultArray[4]
            if (checksumTmp >= 512) checksumTmp -= 512
            if (checksumTmp >= 256) checksumTmp -= 256
            if (checksum == checksumTmp) _readSuccessful = true

            //read data if checksum ok
            if (_readSuccessful) {
                    //DHT11
                    _humidity = resultArray[0] + resultArray[1] / 100
                    _temperature = resultArray[2] + resultArray[3] / 100
            }
            return tipo == dataType.humedad ? _humidity : _temperature    
        }else{
            return -999.0;
        }
    }

    /**
    * Lee la informacion de humedad o temperatura de la ultima consulta al DHT11
    */
    //% block="Leer $data"
 /*   export function readData(data: dataType): number {
        return data == dataType.humidity ? _humidity : _temperature
    }
*/
}
