define(
    [
        'jquery',
        'Magento_Checkout/js/model/quote',
        'Magento_Checkout/js/model/url-builder',
        'mage/storage',
        'Magento_Checkout/js/model/error-processor',
        'Magento_Customer/js/model/customer',
        'Magento_Checkout/js/model/full-screen-loader'
    ],
    function ($, quote, urlBuilder, storage, errorProcessor, customer, fullScreenLoader) {
        'use strict';

        return function (messageContainer) {
            var serviceUrl,
                payload,
                paymentData = quote.paymentMethod();


            /** Checkout for guest and registered customer. */
            if (!customer.isLoggedIn()) {
                serviceUrl = urlBuilder.createUrl('/guest-carts/:quoteId/payment-information', {
                    quoteId: quote.getQuoteId()
                });
                payload = {
                    cartId: quote.getQuoteId(),
                    email: quote.guestEmail,
                    paymentMethod: paymentData,
                    billingAddress: quote.billingAddress()
                };
            } else {
                serviceUrl = urlBuilder.createUrl('/carts/mine/payment-information', {});
                payload = {
                    cartId: quote.getQuoteId(),
                    paymentMethod: paymentData,
                    billingAddress: quote.billingAddress()
                };
            }

            fullScreenLoader.startLoader();

            return storage.post(
                serviceUrl, JSON.stringify(payload)
            ).done(
                function () {
                    var url = window.checkoutConfig.payment[quote.paymentMethod().method].checkoutUrl;
                    var cancelUrl = window.checkoutConfig.payment[quote.paymentMethod().method].cancelUrl;
                    $.get(url)
                        .done(function (data) {
                            try {
                                data = JSON.parse(data);
                                if (data == null) {
                                    $.mage.redirect(cancelUrl);
                                }
                                $.mage.redirect(data["url"]);
                            }catch(err) {
                                $.mage.redirect(cancelUrl);
                            }
                       }).fail(function (response) {
                            errorProcessor.process(response, messageContainer);
                            fullScreenLoader.stopLoader();
                            $.mage.redirect(cancelUrl);
                        });
                }
            ).fail(
                function (response) {
                    errorProcessor.process(response, messageContainer);
                    fullScreenLoader.stopLoader();
                }
            );
        };
    }
);
