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
        console.log("DropInResult:deviceData = " + dropInResult.getDeviceData())
        console.log("DropInResult:paymentDescription = " + dropInResult.getPaymentDescription())
        // if (dropInResult.getPaymentMethodType() != null) {
        //     console.log("DropInResult:paymentMethodType:drawable = " + dropInResult.getPaymentMethodType().getDrawable());
        //     console.log("DropInResult:paymentMethodType:vaultedDrawable = " + dropInResult.getPaymentMethodType().getVaultedDrawable());
        //     console.log("DropInResult:paymentMethodType:localizedName = " + dropInResult.getPaymentMethodType().getLocalizedName());
        // }
        const nonce = dropInResult.getPaymentMethodNonce();
        if (nonce != null) {
            // console.log("Card Last Two: " + nonce.getLastTwo() + "\n");
            // console.log("3DS isLiabilityShifted: " + nonce.getThreeDSecureInfo().isLiabilityShifted() + "\n");
            // console.log("3DS isLiabilityShiftPossible: " + nonce.getThreeDSecureInfo().isLiabilityShiftPossible());

            console.log("nonce.cavv = " + nonce.getThreeDSecureInfo().getCavv());
            console.log("nonce.dsTransactionId = " + nonce.getThreeDSecureInfo().getDsTransactionId());
            console.log("nonce.eciFlag = " + nonce.getThreeDSecureInfo().getEciFlag());
            console.log("nonce.enrolled = " + nonce.getThreeDSecureInfo().getEnrolled());
            console.log("nonce.liabilityShifted = " + nonce.getThreeDSecureInfo().isLiabilityShifted());
            console.log("nonce.liabilityShiftPossible = " + nonce.getThreeDSecureInfo().isLiabilityShiftPossible());
            console.log("nonce.status = " + nonce.getThreeDSecureInfo().getStatus());
            console.log("nonce.threeDSecureVersion = " + nonce.getThreeDSecureInfo().getThreeDSecureVersion());
            console.log("nonce.wasVerified = " + nonce.getThreeDSecureInfo().wasVerified());
            console.log("nonce.xid = " + nonce.getThreeDSecureInfo().getXid());
            console.log("nonce.acsTransactionId = " + nonce.getThreeDSecureInfo().getAcsTransactionId());
            console.log("nonce.threeDSecureAuthenticationId = " + nonce.getThreeDSecureInfo().getThreeDSecureAuthenticationId());
            console.log("nonce.threeDSecureServerTransactionId = " + nonce.getThreeDSecureInfo().getThreeDSecureServerTransactionId());
            console.log("nonce.paresStatus = " + nonce.getThreeDSecureInfo().getParesStatus());
            console.log("nonce.authenticationTransactionStatus = " + nonce.getThreeDSecureInfo().getAuthenticationTransactionStatus());
            console.log("nonce.authenticationTransactionStatusReason = " + nonce.getThreeDSecureInfo().getAuthenticationTransactionStatusReason());
            console.log("nonce.lookupTransactionStatus = " + nonce.getThreeDSecureInfo().getLookupTransactionStatus());
            console.log("nonce.lookupTransactionStatusReason = " + nonce.getThreeDSecureInfo().getLookupTransactionStatusReason());
        }

        this.onSuccessCallback(dropInResult.getPaymentMethodNonce().getString())
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
        console.log("getClientToken")

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

    public startPayment(token: any, options: BrainTreeOptions) {

        let t = this;
        let activity = Application.android.foregroundActivity || Application.android.startActivity;

        let dropInRequest = new DropInRequest();

        console.log("Vault Manager enabled: " + options.vaultManager)
        if (options.vaultManager) {
            dropInRequest.setVaultManagerEnabled(options.vaultManager);
        }

        // dropin 6: no more requested
        // if (options.amount) {
        //     dropInRequest.amount(options.amount);
        // }

        // let getIntentMethod = dropInRequest.getClass().getMethod("getIntent", [android.content.Context.class]);

        // let clientTokenMethod = dropInRequest.getClass().getMethod("clientToken", [java.lang.String.class]);

        // dropin 6: The collectDeviceData field has been removed from DropInRequest in favor of always returning device data.
        // if (options.collectDeviceData) {
        //     dropInRequest.collectDeviceData(true);
        // }

        console.log("Amount: " + options.amount)
        console.log("requestThreeDSecureVerification: " + options.requestThreeDSecureVerification)
        if (options.requestThreeDSecureVerification && options.amount) {

            //-- REQUEST "NOSTRA"
            // const ThreeDSecureRequest = com.braintreepayments.api.ThreeDSecureRequest;
            // let threeDSecureRequest = new com.braintreepayments.api.ThreeDSecureRequest();
            // threeDSecureRequest.amount = options.amount;
            // threeDSecureRequest.versionRequested = ThreeDSecureRequest.VERSION_2;

            // console.log("Setting 3DS verification")
            // dropInRequest.setThreeDSecureRequest(threeDSecureRequest);

            //-- REQUEST DI PROVA CON INFORMAZIONI AGGIUNTIVE
            const address = new ThreeDSecurePostalAddress();
            address.setGivenName("Jill"); // ASCII-printable characters required, else will throw a validation error
            address.setSurname("Doe"); // ASCII-printable characters required, else will throw a validation error
            address.setPhoneNumber("5551234567");
            address.setStreetAddress("555 Smith St");
            address.setExtendedAddress("#2");
            address.setLocality("Chicago");
            address.setRegion("IL"); // ISO-3166-2 code
            address.setPostalCode("12345");
            address.setCountryCodeAlpha2("US");

            // For best results, provide as many additional elements as possible.
            const additionalInformation = new ThreeDSecureAdditionalInformation();
            additionalInformation.setShippingAddress(address);

            const threeDSecureRequest = new ThreeDSecureRequest();
            threeDSecureRequest.amount = options.amount;
            threeDSecureRequest.setEmail("test@email.com");
            threeDSecureRequest.setBillingAddress(address);
            threeDSecureRequest.setVersionRequested(ThreeDSecureRequest.VERSION_2);
            threeDSecureRequest.setAdditionalInformation(additionalInformation);

            threeDSecureRequest.setChallengeRequested(true)

            console.log("Setting 3DS verification")
            dropInRequest.setThreeDSecureRequest(threeDSecureRequest);
        }

        //-- ENABLE AGAIN LATER
        // if (options.enableGooglePay) {
        //     t.enableGooglePay(dropInRequest, options);
        // }

        // clientTokenMethod.invoke(dropInRequest, [token]);
        // let dIRIntent = getIntentMethod.invoke(dropInRequest, [activity]);
        //this.callIntent(dIRIntent);

        console.log("Trying to launch drop in")
        this.dropInClient.launchDropIn(dropInRequest);
        console.log("Launched drop in")
    }

    // private callIntent(intent) {
    //     let t = this;
    //     Application.android.foregroundActivity.startActivityForResult(intent, 4949);
    //     Application.android.on(AndroidApplication.activityResultEvent, onResult);

    //     function onResult(args) {
    //         Application.android.off(AndroidApplication.activityResultEvent, onResult);
    //         t.handleResults(args.requestCode, args.resultCode, args.intent);
    //     }

    // }

    // private handleResults(requestCode, resultCode, data) {

    //     let t = this;
    //     let androidAcivity = android.app.Activity;
    //     if (requestCode === 4949) {

    //         if (resultCode === androidAcivity.RESULT_OK) {

    //             let result = data.getParcelableExtra(com.braintreepayments.api.dropin.DropInResult.EXTRA_DROP_IN_RESULT);
    //             let paymentMethodNonce = result.getPaymentMethodNonce().getNonce();

    //             if (typeof result.paymentMethod == null) {

    //                 t.output.status = 'error';
    //                 t.output.msg = 'Nonce Value empty';

    //                 setTimeout(function () {
    //                     t.notify({
    //                         eventName: 'error',
    //                         object: t
    //                     });
    //                 });
    //                 return;
    //             }

    //             // send paymentMethodNonce to your server
    //             t.output.status = 'success';
    //             t.output.msg = 'Got Payment Nonce Value';
    //             t.output.nonce = paymentMethodNonce;
    //             t.output.deviceInfo = result.getDeviceData();
    //             t.output.paymentMethodType = result.getPaymentMethodType().getCanonicalName();

    //             setTimeout(function () {
    //                 t.notify({
    //                     eventName: 'success',
    //                     object: t
    //                 });
    //             });

    //         } else if (resultCode === androidAcivity.RESULT_CANCELED) {
    //             // canceled
    //             t.output.status = 'cancelled';
    //             t.output.msg = 'User has cancelled payment';

    //             setTimeout(function () {
    //                 t.notify({
    //                     eventName: 'cancel',
    //                     object: t
    //                 });
    //             });

    //         } else {
    //             // an error occurred, checked the returned exception
    //             let exception = data.getSerializableExtra(com.braintreepayments.api.dropin.DropInActivity.EXTRA_ERROR);
    //             t.output.msg = exception.getMessage();

    //             setTimeout(function () {
    //                 t.notify({
    //                     eventName: 'error',
    //                     object: t
    //                 });
    //             });
    //         }
    //     }

    // }

    private enableGooglePay(dropInRequest, options: BrainTreeOptions): void {

        const GooglePayRequest = com.braintreepayments.api.GooglePayRequest;
        const TransactionInfo = com.google.android.gms.wallet.TransactionInfo;
        const WalletConstants = com.google.android.gms.wallet.WalletConstants;

        let googlePaymentRequest = new GooglePayRequest()
        googlePaymentRequest.setTransactionInfo(TransactionInfo.newBuilder()
            .setTotalPrice(options.amount)
            .setTotalPriceStatus(WalletConstants.TOTAL_PRICE_STATUS_FINAL)
            .setCurrencyCode(options.currencyCode)
            .build())
        googlePaymentRequest.setBillingAddressRequired(true);
        if (options.googleMerchantId) {
            googlePaymentRequest.googleMerchantId(options.googleMerchantId);
        }

        dropInRequest.setGooglePayRequest(googlePaymentRequest);
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

