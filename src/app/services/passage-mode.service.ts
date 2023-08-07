import { Injectable } from '@angular/core';
import { PassageMode } from '../Interfaces/PassageMode';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import moment from 'moment';
import { BehaviorSubject, lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PassageModeService {
  
  private dataSubject = new BehaviorSubject<any>(null);
  data$ = this.dataSubject.asObservable();
  token:string;
  lockID:number;
  passageModeConfig:PassageMode;

  constructor(private http:HttpClient) { }

  public timestamp(){
    let timeInShanghai = moment().tz('Asia/Shanghai').valueOf();
    return timeInShanghai;
  }

  async getPassageModeConfig(token:string, lockId:number){
    let fecha = this.timestamp()
    let url = 'https://euapi.ttlock.com/v3/lock/getPassageModeConfig'
    let header = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'});
    let options = { headers: header};
    let body = new URLSearchParams();
    body.set('clientId', 'c4114592f7954ca3b751c44d81ef2c7d');
    body.set('accessToken', token);
    body.set('lockId', lockId.toString());
    body.set('date', fecha.toString());
    try{
      const response = await lastValueFrom(this.http.post(url, body.toString(), options));
      this.dataSubject.next(response);
    } catch (error){
      console.error("Error while fetching passage mode configurations:", error);
      this.dataSubject.next(null); // Emit null to dataSubject on error
    }
  }

  async setPassageMode(token:string, lockId:number, Config: PassageMode){
    let fecha = this.timestamp()
    let url = 'https://euapi.ttlock.com/v3/lock/configPassageMode'
    let header = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'});
    let options = { headers: header};
    let body = new URLSearchParams();
    body.set('clientId', 'c4114592f7954ca3b751c44d81ef2c7d');
    body.set('accessToken', token);
    body.set('lockId', lockId.toString());
    body.set('passageMode', Config.passageMode.toString());
    body.set('startDate', Config.startDate);
    body.set('endDate', Config.endDate);
    body.set('isAllDay', Config.isAllDay.toString());
    body.set('weekDays', JSON.stringify(Config.weekDays));    
    body.set('type', '2');
    body.set('date', fecha.toString());
    try{
      const response = await lastValueFrom(this.http.post(url, body.toString(), options));
      this.dataSubject.next(response);
    } catch (error){
      console.error("Error while setting passage mode configurations:", error);
      this.dataSubject.next(null); // Emit null to dataSubject on error
    }
  }
}
