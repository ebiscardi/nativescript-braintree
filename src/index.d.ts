import { Observable } from "@nativescript/core";

export declare function setupBraintreeAppDeligate(urlScheme: any): void;

export declare class Braintree extends Observable {
  constructor(clientTokenProvider?: Function);
  output: {
    'status': string;
    'msg': string;
    'nonce': string;
    'paymentMethodType': string;
    'deviceInfo': string;
  };
  setCallbackFunctions(
    onSuccessCallback: Function,
    onErrorCallback: Function,
    onCancelCallback: Function
  ): void;
  startPayment(token: any, options: BrainTreeOptions): void;
  setAndroidListener(listener)
  private callIntent(intent);
  private handleResults(requestCode, resultCode, data);
}

export interface BrainTreeOptions {
  /**
    * Amount is ignored when using Apple Pay
    */
  amount: string;
  collectDeviceData?: boolean;
  requestThreeDSecureVerification?: boolean;
  applePayPaymentRequest?: PKPaymentRequest;
  /**
    * currencyCode is required for Google Pay
    */
  enableGooglePay?: boolean;
  googleMerchantId?: string;
  currencyCode?: string;
  vaultManager?: boolean;
}

export interface ApplePayLineItem {
  label: string;
  amount: number;
}
