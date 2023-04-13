import { LightningElement, wire, api, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { createRecord, getRecord, updateRecord } from "lightning/uiRecordApi";
import proid from "@salesforce/schema/Project__c.Id";
import { NavigationMixin } from "lightning/navigation";
import count from "@salesforce/schema/Project__c.count__c";
import getCustomObject from "@salesforce/apex/pdfGenerateApexClass.billingInfo";
import workinhoursum from "@salesforce/apex/pdfGenerateApexClass.workingHour";
import csvInfo from "@salesforce/apex/pdfGenerateApexClass.csvInfo";
//import { CloseActionScreenEvent } from 'lightning/actions';
const FIELDS = [
  "Project__c.Name",
  "Project__c.Client__c",
  "Project__c.count__c",
  "Project__c.Prefix__c",
  //bill to
  "Project__c.Billing_Address_Name__c	",
  "Project__c.Billing_Address_Company_Name__c",
  "Project__c.Billing_Address__Street__s",
  "Project__c.Billing_Address__City__s",
  "Project__c.Billing_Address__StateCode__s",
  "Project__c.Billing_Address__PostalCode__s",
  "Project__c.Billing_Address__CountryCode__s",
  //paymentinformation
  "Project__c.Beneficiary_Name__c",
  "Project__c.Beneficiary_Account_Number__c",
  "Project__c.Bank_Name__c",
  "Project__c.Bank_Address__c"
];
const tempObj = [
  "Billing_Address_Name__c",
  "Billing_Address_Company_Name__c",
  "Billing_Address__PostalCode__s",
  "Billing_Address__City__s",
  "Billing_Address__Street__s",
  "Bank_Address__c",
  "Bank_Name__c",
  "Beneficiary_Account_Number__c",
  "Beneficiary_Name__c"
];
const FIELDSfrmclient = ["Account.Name"];
export default class GeneratePdfLWC extends NavigationMixin(LightningElement) {
  @track csvData; //CSV INFO TO PRINT

  @track isLoaded = false; //SPINNER HIDE OR SHOW
  @api recordId; //PROJECT ID
  @track billingInfoRecord; // BILLING RECORD AND PAYMENT INFO FROM APEX
  @track isChecked; //CREATE OR NOT CREATE DATA
  @track objectApiName = "Invoice__c";
  @track tempVar; //TO GENERATE THE AMOUNT AND SUMOF HOUR BY MULTIPLYING
  @track proObj; //PROJECT INFO
  @track clientObj; //PROJECT-->CLIENT INFO
  // @track totalcount;
  @track idcl; //CLIENT ID
  //@track prname;
  @track hr; //SUM OF HOUR INFO
  @wire(getRecord, {
    recordId: "$recordId",
    fields: FIELDS, //API TO FETCH PROJECT RECORD
    modes: ["View", "Edit", "Create"]
  })
  wiredRecordproject({ error, data }) {
    if (data) {
      console.log(data);
      this.proObj = data; //API TO FETCH PROJECT AND USE RECORD
      this.idcl = data.fields.Client__c.value;
      console.log("count" + data.fields.count__c.value);

      console.log(data.fields.Client__c.value);
    } else if (error) {
      console.log("error" + error);
      this.error = error;
    }
  }

  @wire(getRecord, {
    recordId: "$idcl",
    fields: FIELDSfrmclient, //API TO FETCH PROJECT-->CLIENT INFO
    modes: ["View", "Edit", "Create"]
  })
  wiredRecordclient({ error, data }) {
    if (data) {
      this.clientObj = data;
      console.log(data);
      console.log("Name " + data.fields.Name.value); //API TO FETCH PROJECT--> USE CLIENT INFO
      console.log(" this.clientObj" + this.clientObj.fields.Name.value);
    } else if (error) {
      console.log("Error" + error);
      this.error = error;
    }
  }
  handleCheckboxChange(event) {
    this.isChecked = event.target.checked; //CREATE OR NOT RECORDFOR INVOICE OBJECT
  }

  @track PaidDate = new Date();

  @track InvoiceDate;
  connectedCallback() {
    this.PaidDate = new Date().toISOString().slice(0, 10);
    console.log(this.PaidDate);
    let date = new Date(); //DATE CHANGE ACCORDING TO THE MONTH AND FIRST OF EVERY MONTH
    this.InvoiceDate = new Date(date.getFullYear(), date.getMonth(), 1, 0);

    let myDate = this.InvoiceDate;
    myDate.setHours(myDate.getHours() + 10);
    this.InvoiceDate = myDate.toISOString().slice(0, 10);
    console.log("mydate" + myDate);

    getCustomObject().then((result) => {
      console.log(result);
      this.billingInfoRecord = result; //FETCH BILLING AND PAYMENT RECORD FROM APEX
      console.log(this.billingInfoRecord.Billing_Address_Name__c);
      if (
        this.proObj.fields.Bank_Address__c.value != null &&
        this.proObj.fields.Bank_Name__c.value != null &&
        this.proObj.fields.Beneficiary_Account_Number__c.value != null &&
        this.proObj.fields.Beneficiary_Name__c.value != null
      ) {
        tempObj.Bank_Address__c = this.proObj.fields.Bank_Address__c.value;
        tempObj.Bank_Name__c = this.proObj.fields.Bank_Name__c.value;
        tempObj.Beneficiary_Account_Number__c =
          this.proObj.fields.Beneficiary_Account_Number__c.value; //IF PROVIDED BY THE USER FOR PAYMENT
        tempObj.Beneficiary_Name__c =
          this.proObj.fields.Beneficiary_Name__c.value;
      } else {
        tempObj.Bank_Address__c = this.billingInfoRecord.Bank_Address__c;
        tempObj.Bank_Name__c = this.billingInfoRecord.Bank_Name__c;
        tempObj.Beneficiary_Account_Number__c = //USE CUSTOM SETTING INFO FOR PAYMENT
          this.billingInfoRecord.Beneficiary_Account_Number__c;
        tempObj.Beneficiary_Name__c =
          this.billingInfoRecord.Beneficiary_Name__c;
      }
      if (
        this.proObj.fields.Billing_Address_Name__c.value != null &&
        this.proObj.fields.Billing_Address_Company_Name__c.value != null &&
        this.proObj.fields.Billing_Address__PostalCode__s.value != null &&
        this.proObj.fields.Billing_Address__City__s.value != null &&
        this.proObj.fields.Billing_Address__Street__s.value != null
      ) {
        tempObj.Billing_Address_Name__c =
          this.proObj.fields.Billing_Address_Name__c.value;
        tempObj.Billing_Address_Company_Name__c =
          this.proObj.fields.Billing_Address_Company_Name__c.value; //IF PROVIDED BY THE USSER BILLING INFO
        tempObj.Billing_Address__PostalCode__s =
          this.proObj.fields.Billing_Address__PostalCode__s.value;
        tempObj.Billing_Address__City__s =
          this.proObj.fields.Billing_Address__City__s.value;
        tempObj.Billing_Address__Street__s =
          this.proObj.fields.Billing_Address__Street__s.value;

        console.log("already exist");
      } else {
        tempObj.Billing_Address_Name__c =
          this.billingInfoRecord.Billing_Address_Name__c;
        tempObj.Billing_Address__PostalCode__s =
          this.billingInfoRecord.Billing_Address__PostalCode__s;
        tempObj.Billing_Address__Street__s =
          this.billingInfoRecord.Billing_Address__Street__s; //USE FROM CUSTOM SETTING FOR BILLING INFO
        tempObj.Billing_Address_Company_Name__c =
          this.billingInfoRecord.Billing_Address_Company_Name__c;
        tempObj.Billing_Address__City__s =
          this.billingInfoRecord.Billing_Address__City__s;
      }
    });
  }
  sdatefield(event) {
    console.log(" this.clientObj" + this.clientObj.fields.Name.value);
    this.InvoiceDate = new Date(event.target.value).toISOString().slice(0, 10);
    const dateObj = new Date(event.target.value);
    const month = dateObj.getMonth();
    const dateObjofPaidDate = new Date(this.PaidDate);

    const year = dateObjofPaidDate.getFullYear();
    const day = dateObjofPaidDate.getDate();
    console.log("day" + day);
    this.PaidDate = new Date(year, month, day);
    let myDate = this.PaidDate;
    myDate.setHours(myDate.getHours() + 10);
    this.PaidDate = myDate.toISOString().slice(0, 10);
    console.log("onchangesfield" + this.InvoiceDate); //FETCH DATE FROM START DATE FIELD
  }
  datefield(event) {
    console.log(this.PaidDate);
    //console.log(this.proObj.fields.Client__c.value);
    this.PaidDate = new Date(event.target.value).toISOString().slice(0, 10);
    const dateObj = new Date(event.target.value);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    this.InvoiceDate = new Date(year, month, 1); //FETCH DATE FROM END DATE FIELD
    let myDate = this.InvoiceDate;
    myDate.setHours(myDate.getHours() + 10);
    this.InvoiceDate = myDate.toISOString().slice(0, 10);
    console.log("datefield" + this.PaidDate + "first" + this.InvoiceDate);
  }
  @track Amount;
  Amountfield(event) {
    this.Amount = event.target.value; //FETCH AMOUNT FROM AMOUNT FIELD
    console.log(this.Amount);
  }

  async handleCreateRecord() {
    //SUBMIT BUTTON
    try {
      const resul = await workinhoursum({
        Projectid: this.recordId,
        startDate: this.InvoiceDate, //FETCCH SUM OF WORKING HOUR OF TIME LOG
        endDate: this.PaidDate
      });
      this.hr = resul;
      console.log("this.hr" + this.hr);
      console.log(typeof (this.hr * this.Amount));
      this.tempVar = this.hr * this.Amount; //SUMOF WORKING HOUR*AMOUNT

      //csv info

      this.csvData = await csvInfo({
        Projectid: this.recordId,
        startDate: this.InvoiceDate, //FETCH CSV INFO FROM APEX
        endDate: this.PaidDate
      });
      this.handleDownload(); //CALL DOWNLOAD CSV FILE

      if (this.isChecked) {
        //WHEN CREATE INVOICE
        console.log(this.proObj.fields.Billing_Address_Company_Name__c.value);
        const fields = {
          Name:
            this.proObj.fields.Prefix__c.value +
            this.proObj.fields.count__c.value, //CREATE INVOICE USING API
          Project__c: this.recordId,
          Paid_Date__c: this.PaidDate,
          Amount__c: this.tempVar,
          Invoice_Date__c: new Date(this.InvoiceDate),
          //billing address
          Billing_Address__Street__s: tempObj.Billing_Address__Street__s,
          Billing_Address__City__s: tempObj.Billing_Address__City__s,
          Billing_Address__PostalCode__s:
            tempObj.Billing_Address__PostalCode__s,

          Billing_Address__CountryCode__s:
            this.proObj.fields.Billing_Address__CountryCode__s.value,
          Billing_Address_Name__c: tempObj.Billing_Address_Name__c,
          Billing_Address_Company_Name__c:
            tempObj.Billing_Address_Company_Name__c,
          //payment infor
          Beneficiary_Name__c: tempObj.Beneficiary_Name__c,
          Beneficiary_Account_Number__c: tempObj.Beneficiary_Account_Number__c,
          Bank_Name__c: tempObj.Bank_Name__c,
          Bank_Address__c: tempObj.Bank_Address__c
        };
        // const fields={Name:this.prname};
        console.log(fields);

        const recordInput = { apiName: this.objectApiName, fields };
        createRecord(recordInput)
          .then((result) => {
            console.log("Invoice created with Id: " + result.id);
            ////////////////////////////////
            const fieldsw = {};
            //this.proObj.fields.count__c.value
            fieldsw[count.fieldApiName] = this.proObj.fields.count__c.value + 1;
            fieldsw[proid.fieldApiName] = this.recordId;
            console.log("---------" + JSON.stringify(fieldsw));
            const userRecordInput = { fields: fieldsw };

            updateRecord(userRecordInput).then(() => {
              console.log("updated");
            });

            //////////////////////////////////
            this.dispatchEvent(
              new ShowToastEvent(
                {
                  title: "Success",
                  message: "New Invoice Created.",
                  variant: "success" //DISPATCH TOAST
                },
                2000
              )
            );
            this.isLoaded = true;

            const dtf = new Intl.DateTimeFormat("en", {
              year: "numeric",
              month: "short",
              day: "2-digit" //DATE FORMAT IN DAY-MONTH-YEAR
            });
            const [{ value: mo }, , { value: da }, , { value: ye }] =
              dtf.formatToParts(new Date(this.InvoiceDate));

            let dump = `${da}-${mo}-${ye}`;
            console.log("formatedDate ===> " + dump);

            window.open(
              "https://logicmount--lwc--c.sandbox.vf.force.com/apex/lwcpdf?Name=" +
                this.proObj.fields.Prefix__c.value +
                "&Amount=" +
                this.tempVar +
                "&Pdate=" + //OPEN VF PAGE AND DOWNLOAD PDF
                dump +
                "&invoicename=" +
                this.proObj.fields.Prefix__c.value +
                this.proObj.fields.count__c.value +
                "&Billing_Address__Street__s=" +
                tempObj.Billing_Address__Street__s +
                "&Billing_Address__City__s=" +
                tempObj.Billing_Address__City__s +
                "&Billing_Address__PostalCode__s=" +
                tempObj.Billing_Address__PostalCode__s +
                "&Billing_Address_Name__c=" +
                tempObj.Billing_Address_Name__c +
                "&Billing_Address_Company_Name__c=" +
                tempObj.Billing_Address_Company_Name__c +
                //payment infor
                "&Beneficiary_Name__c=" +
                tempObj.Beneficiary_Name__c +
                "&Beneficiary_Account_Number__c=" +
                tempObj.Beneficiary_Account_Number__c +
                "&Bank_Name__c=" +
                tempObj.Bank_Name__c +
                "&Bank_Address__c=" +
                tempObj.Bank_Address__c +
                "&obj=" +
                this.tempObj,
              "_self"
            );

            // eslint-disable-next-line @lwc/lwc/no-async-operation
            setInterval(() => {
              this.isLoaded = false;
            }, 4000);
            //this.isLoaded=false;
          })
          .catch((error) => {
            console.error("Error creating Invoice: " + error);
          });
      } else {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Pdf AND Excel Downloaded without Creating New Record", //DISPATCH TOAST
            variant: "success"
          })
        );
        console.log(this.Name);
        this.isLoaded = true;
        const dtf = new Intl.DateTimeFormat("en", {
          year: "numeric",
          month: "short",
          day: "2-digit" //DATE FORMAT DAY-MONTH-YEAR
        });
        const [{ value: mo }, , { value: da }, , { value: ye }] =
          dtf.formatToParts(new Date(this.InvoiceDate));

        let dump = `${da}-${mo}-${ye}`;

        console.log("formatedDate ===> " + dump);
        window.open(
          "https://logicmount--lwc--c.sandbox.vf.force.com/apex/lwcpdf?Name=" +
            this.proObj.fields.Prefix__c.value +
            "&Amount=" +
            this.tempVar +
            "&Pdate=" + //OPEN VF PAGE AND DOWNLOAD PDF
            dump +
            "&invoicename=" +
            this.proObj.fields.Prefix__c.value +
            this.proObj.fields.count__c.value +
            "&Billing_Address__Street__s=" +
            tempObj.Billing_Address__Street__s +
            "&Billing_Address__City__s=" +
            tempObj.Billing_Address__City__s +
            "&Billing_Address__PostalCode__s=" +
            tempObj.Billing_Address__PostalCode__s +
            "&Billing_Address_Name__c=" +
            tempObj.Billing_Address_Name__c +
            "&Billing_Address_Company_Name__c=" +
            tempObj.Billing_Address_Company_Name__c +
            //payment infor
            "&Beneficiary_Name__c=" +
            tempObj.Beneficiary_Name__c +
            "&Beneficiary_Account_Number__c=" +
            tempObj.Beneficiary_Account_Number__c +
            "&Bank_Name__c=" +
            tempObj.Bank_Name__c +
            "&Bank_Address__c=" +
            tempObj.Bank_Address__c,
          "_self"
        );
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setInterval(() => {
          this.isLoaded = false;
        }, 4000);
        console.log("Checkbox not checked. Record not created.");
      }
    } catch (error) {
      console.log(error);
    }
  }
  handleDownload() {
    const downloadLink = document.createElement("a");
    downloadLink.href = //DOWNLOAD CSV
      "data:text/csv;charset=utf-8," + encodeURIComponent(this.csvData);
    downloadLink.download = "mydata.csv";

    downloadLink.click();
  }
}
