import { AndroidApplication, Application, Observable } from "@nativescript/core";

declare const com;
const DropInRequest = com.braintreepayments.api.DropInRequest;
const ClientTokenProvider = com.braintreepayments.api.ClientTokenProvider;
const ClientTokenCallback = com.braintreepayments.api.ClientTokenCallback;
const ThreeDSecurePostalAddress = com.braintreepayments.api.ThreeDSecurePostalAddress;
const ThreeDSecureAdditionalInformation = com.braintreepayments.api.ThreeDSecureAdditionalInformation;
const ThreeDSecureRequest = com.braintreepayments.api.ThreeDSecureRequest;

export function setupBraintreeAppDeligate(urlScheme) {
    // to avoid error
}

@NativeClass
@Interfaces([com.braintreepayments.api.DropInListener])
//@ts-ignore
class DropInListener extends java.lang.Object implements com.braintreepayments.api.DropInListener {

    onSuccessCallback: Function;
    onErrorCallback: Function;
    onCancelCallback: Function;

    constructor(onSuccessCallback: Function,
        onErrorCallback: Function,
        onCancelCallback: Function) {
        super()
        this.onSuccessCallback = onSuccessCallback;
        this.onErrorCallback = onErrorCallback;
        this.onCancelCallback = onCancelCallback;
    }

    onDropInSuccess(dropInResult) {
        const nonce = dropInResult.getPaymentMethodNonce().getString();
        console.log("OnDropInSuccess: nonce is " + nonce)
        this.onSuccessCallback(nonce)
    }

    onDropInFailure(error) {
        if (error.toString().includes("UserCanceledException")) {
            console.log("Payment canceled")
            this.onCancelCallback()
        } else {
            console.log("Payment error: " + error)
            this.onErrorCallback()
        }
    }
}

@NativeClass
@Interfaces([com.braintreepayments.api.ClientTokenProvider])
//@ts-ignore
class BTTokenRetriever extends java.lang.Object implements braintreepayments.api.ClientTokenProvider {

    btClient: Function;

    constructor(btClient) {
        super()
        console.log("constructor")
        this.btClient = btClient;
        console.log("constructor")
        return global.__native(this);
    }

    public getClientToken(callback) {
        this.btClient().then((token) => {
            console.error("[parking-detail-view-model] received token: " + token);
            callback.onSuccess(token);
        })
            .catch((e) => {
                console.error("[parking-detail-view-model] error: " + e);
                callback.onFailure(e);
            })
    }
}
export class Braintree extends Observable {

    public output = {
        'status': 'fail',
        'msg': 'unknown',
        'nonce': '',
        'paymentMethodType': '',
        'deviceInfo': ''
    };

    private dropInClient;

    constructor(
        braintreeTokenProviderFunction: Function) {
        super();

        let activity = Application.android.foregroundActivity || Application.android.startActivity;
        this.dropInClient = new com.braintreepayments.api.DropInClient(activity, new BTTokenRetriever(braintreeTokenProviderFunction));

        console.log(this.dropInClient ? "Braintree Drop-in client created" : "Failed to create Drop-in client");
    }

    public setCallbackFunctions(
        onSuccessCallback: Function,
        onErrorCallback: Function,
        onCancelCallback: Function
    ) {
        const dropInListener = new DropInListener(
            onSuccessCallback,
            onErrorCallback,
            onCancelCallback
        )
        this.dropInClient.setListener(dropInListener)
    }

    public startDropIn(options: BrainTreeOptions) {

        let t = this;
        let dropInRequest = new DropInRequest();

        console.log("Vault Manager enabled: " + options.vaultManager)
        if (options.vaultManager) {
            dropInRequest.setVaultManagerEnabled(options.vaultManager);
        }

        console.log("Amount: " + options.amount)
        console.log("requestThreeDSecureVerification: " + options.requestThreeDSecureVerification)
        if (options.requestThreeDSecureVerification && options.amount) {
            const ThreeDSecureRequest = com.braintreepayments.api.ThreeDSecureRequest;
            let threeDSecureRequest = new com.braintreepayments.api.ThreeDSecureRequest();
            threeDSecureRequest.setAmount(options.amount);
            threeDSecureRequest.setVersionRequested(ThreeDSecureRequest.VERSION_2);
            console.log("Setting 3DS verification")
            dropInRequest.setThreeDSecureRequest(threeDSecureRequest);
        }

        if (options.enableGooglePay) {
            t.enableGooglePay(dropInRequest, options);
        }

        console.log("Trying to launch drop in")
        this.dropInClient.launchDropIn(dropInRequest);
        console.log("Launched drop in")
    }

    private enableGooglePay(dropInRequest, options: BrainTreeOptions): void {

        console.log("Enabling Google pay")
        const GooglePayRequest = com.braintreepayments.api.GooglePayRequest;
        const TransactionInfo = com.google.android.gms.wallet.TransactionInfo;
        const WalletConstants = com.google.android.gms.wallet.WalletConstants;

        let googlePayRequest = new GooglePayRequest()
        googlePayRequest.setTransactionInfo(TransactionInfo.newBuilder()
            .setTotalPrice(options.amount)
            .setTotalPriceStatus(WalletConstants.TOTAL_PRICE_STATUS_FINAL)
            .setCurrencyCode(options.currencyCode)
            .build())
        googlePayRequest.setBillingAddressRequired(true);
        // if (options.googleMerchantId) {
        //     googlePayRequest.setGoogleMerchantId(options.googleMerchantId);
        // }

        console.log("Google pay: total price = " + googlePayRequest.getTransactionInfo().getTotalPrice())
        console.log("Google pay: currency = " + googlePayRequest.getTransactionInfo().getCurrencyCode());
        console.log("Google pay: billing address required = " + googlePayRequest.isBillingAddressRequired());

        dropInRequest.setGooglePayRequest(googlePayRequest);
    }

}

export interface BrainTreeOptions {
    amount: string;
    collectDeviceData?: boolean;
    requestThreeDSecureVerification?: boolean;
    // Required for google pay
    enableGooglePay?: boolean;
    googleMerchantId?: string;
    currencyCode?: string;
    vaultManager?: boolean;
}

