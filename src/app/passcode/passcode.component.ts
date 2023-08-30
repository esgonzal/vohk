import { Component } from '@angular/core';
import { Formulario } from '../Interfaces/Formulario';
import { PasscodeServiceService } from '../services/passcode-service.service';
import { Router } from '@angular/router';
import moment from 'moment';
import { LockServiceService } from '../services/lock-service.service';
import { PopUpService } from '../services/pop-up.service';

@Component({
  selector: 'app-passcode',
  templateUrl: './passcode.component.html',
  styleUrls: ['./passcode.component.css'],
})
export class PasscodeComponent {

  constructor(public passcodeService: PasscodeServiceService, public lockService: LockServiceService, private router: Router, public popupService: PopUpService) { }
  username = localStorage.getItem('user') ?? ''
  lockId: number = Number(localStorage.getItem('lockID') ?? '')
  gateway = localStorage.getItem('gateway') ?? ''
  featureValue = localStorage.getItem('features') ?? '';
  howManyHours = '';
  error = '';
  selectedType = '';
  onSelected(value: string): void { this.selectedType = value }
  onSelectedHour(value: string): void { this.howManyHours = value }

  transformarHora(Tiempo: string) {
    let tiempoHora = Tiempo.split(":")[0]
    let tiempoMinuto = Tiempo.split(":")[1]
    return ((Number(tiempoHora) * 60 + Number(tiempoMinuto)) * 60000).toString()
  }

  validaFechaUsuario(diaFinal: string, horaFinal: string, tipo: string): boolean {
    if (this.passcodeService.endDateUser !== '0') {
      if (tipo === "1" || tipo === "2" || tipo === "4" || tipo === "Custom_Permanent") {
        this.error = "Usted como usuario con autorización temporal no puede crear una clave permanente"
        //La clave es permanente
        return false
      }
      else {
        let unixTimestamp = parseInt(this.passcodeService.endDateUser);
        let endUser = moment.unix(unixTimestamp / 1000);
        let endDate = moment(diaFinal).add(this.transformarHora(horaFinal), "milliseconds")
        if (endUser.isBefore(endDate)) {
          this.error = "La clave termina posterior a su permiso de autorización, comuníquese con el administrador de esta cerradura"
          //El usuario termina antes que la clave
          return false;
        }
        else {
          //El usuario termina despues que la clave
          return true
        }
      }
    }
    else {
      //El usuario es permanente
      return true;
    }
  }

  validaFechaInicio(diaInicial: string, horaInicial: string, diaFinal: string, horaFinal: string, tipo: string): boolean {
    if (tipo !== "1" && tipo !== "2" && tipo !== "4" && tipo !== "Custom_Permanent") {
      let start = moment(diaInicial).add(this.transformarHora(horaInicial), "milliseconds")
      if (start.add(24, 'hours').isBefore(moment())) {
        this.error = "La passcode no puede iniciar 24 horas antes que ahora"
        //La clave empieza 24 horas antes que ahora
        return false;
      }
      else {
        let startDate = moment(diaInicial).add(this.transformarHora(horaInicial), "milliseconds")
        let endDate = moment(diaFinal).add(this.transformarHora(horaFinal), "milliseconds")
        if (endDate.isBefore(startDate)) {
          this.error = "El tiempo de inicio debe ser anterior al tiempo de finalización"
          //La clave termina antes de la fecha de inicio
          return false;
        }
        else {
          //La clave termina despues de la fecha de inicio
          return true;
        }
      }
    }
    else {
      //La clave es permanente
      return true;
    }
  }

  async crearpasscode(datos: Formulario) {
    if (!datos.passcodePwd) {
      if (datos.startDate) {
        //PERIODIC PASSCODE
        let newStartDay = moment(datos.startDate).valueOf()
        let newEndDay = moment(datos.endDate).valueOf()
        let newStartDate = moment(newStartDay).add(this.transformarHora(datos.startHour), "milliseconds").valueOf()
        let newEndDate = moment(newEndDay).add(this.transformarHora(datos.endHour), "milliseconds").valueOf()
        await this.passcodeService.generatePasscode(this.passcodeService.token, this.passcodeService.lockID, datos.passcodeType, newStartDate.toString(), datos.name, newEndDate.toString());
        this.router.navigate(["users", this.username, "lock", this.lockId]);
      }
      else {
        if (datos.startHour) {
          //RECURRING PASSCODE
          await this.passcodeService.generatePasscode(this.passcodeService.token, this.passcodeService.lockID, datos.passcodeType, this.lockService.convertirDate(datos.startHour), datos.name, this.lockService.convertirDate(datos.endHour));
          this.router.navigate(["users", this.username, "lock", this.lockId]);
        }
        else {
          //PERMANENT PASSCODE
          await this.passcodeService.generatePasscode(this.passcodeService.token, this.passcodeService.lockID, datos.passcodeType, moment().valueOf().toString(), datos.name)
          this.router.navigate(["users", this.username, "lock", this.lockId]);
        }
      }
    }
    else {
      if (this.gateway === '1') {
        if (datos.startDate) {
          //CUSTOM PERIOD PASSCODE
          let newStartDay = moment(datos.startDate).valueOf()
          let newEndDay = moment(datos.endDate).valueOf()
          let newStartDate = moment(newStartDay).add(this.transformarHora(datos.startHour), "milliseconds").valueOf()
          let newEndDate = moment(newEndDay).add(this.transformarHora(datos.endHour), "milliseconds").valueOf()
          await this.passcodeService.generateCustomPasscode(this.passcodeService.token, this.passcodeService.lockID, datos.passcodePwd, "3", datos.name, newStartDate.toString(), newEndDate.toString());
          this.router.navigate(["users", this.username, "lock", this.lockId]);
        }
        else {
          //CUSTOM PERMANENT PASSCODE
          await this.passcodeService.generateCustomPasscode(this.passcodeService.token, this.passcodeService.lockID, datos.passcodePwd, "2", datos.name, "0", "0");
          this.router.navigate(["users", this.username, "lock", this.lockId]);
        }
      } else {
        this.popupService.needGateway = true;
      }
    }
  }

  validarNuevaPass(datos: Formulario) {
    this.error = '';
    if (!datos.passcodeType) {
      this.error = "Por favor elija un tipo de passcode"
    }
    else {
      if (((datos.passcodeType === '3' || datos.passcodeType === 'Custom_Period') && (!datos.startDate || !datos.endDate || !datos.startHour || !datos.endHour)) ||
        ((datos.passcodeType === '5' || datos.passcodeType === '6' || datos.passcodeType === '7' || datos.passcodeType === '8' || datos.passcodeType === '9' || datos.passcodeType === '10' || datos.passcodeType === '11' || datos.passcodeType === '12' || datos.passcodeType === '13' || datos.passcodeType === '14') && (!datos.startHour || !datos.endHour))) {
        this.error = "Por favor rellene los datos de fecha y/o hora"
      }
      else {
        if ((datos.passcodeType === 'Custom_Period' || datos.passcodeType === 'Custom_Permanent') && !datos.passcodePwd) {
          this.error = "Por favor introduzca una contraseña"
        }
        else {
          if (Number(datos.passcodePwd) < 1000 || Number(datos.passcodePwd) > 999999999) {
            this.error = "La contraseña debe tener entre 4 y 9 digitos"
          }
          else {
            if (this.validaFechaInicio(datos.startDate, datos.startHour, datos.endDate, datos.endHour, datos.passcodeType)) {
              if (this.validaFechaUsuario(datos.endDate, datos.endHour, datos.passcodeType)) {
                this.crearpasscode(datos);
              }
            }
          }
        }
      }
    }
  }

  validarPasscodeSimple(datos: Formulario) {
    console.log("Hora: ", this.howManyHours)
    console.log("Inicio de clave: ", moment().format("HH:mm DD/MM/YYYY"))
    console.log("Final de clave: ", moment().add(this.howManyHours, "hours").format("HH:mm DD/MM/YYYY"))
    let startDate = moment().valueOf()
    let endDate = moment().add(this.howManyHours, "hours").valueOf()
    this.passcodeService.generatePasscode(this.passcodeService.token, this.passcodeService.lockID, '3', startDate.toString(), datos.name, endDate.toString())
    this.passcodeService.passcodesimple = false;
    this.router.navigate(["users", this.username, "lock", this.lockId]);
  }
}

