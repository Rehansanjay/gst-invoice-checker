import Script from 'next/script';

/**
 * Microsoft Clarity: session recordings and heatmaps.
 *
 * GA counts what happened (a check was submitted); Clarity shows how, such
 * as where people hesitate on the invoice form or rage-click a button that
 * does nothing. That is the gap between "no one pays" and knowing why.
 *
 * Off unless NEXT_PUBLIC_CLARITY_ID is set, so local and preview builds
 * record nothing. Invoice data is kept out of recordings with
 * data-clarity-mask on the form and results; set Masking to "Strict" in the
 * Clarity project settings as a second guard.
 */
export default function ClarityScript() {
    const id = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (!id || !/^[a-z0-9]+$/i.test(id)) return null;

    return (
        <Script id="ms-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${id}");`}
        </Script>
    );
}
