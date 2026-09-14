/* =====================================================
   ROHINI-1 NIVEDAN COMMON REQUEST SYSTEM
   Firebase Realtime Database
===================================================== */

const NIVEDAN_DB =
"https://sunil-online-service-default-rtdb.firebaseio.com";


const NivedanRequest = {

    currentRequestId: null,


    /* -----------------------------------------------
       START
    ------------------------------------------------ */

    init: function(options){

        options = options || {};

        const formName =
            options.formName ||
            document.title ||
            "निवेदन";

        const printButtonId =
            options.printButtonId ||
            "printBtn";


        const btn =
            document.getElementById(printButtonId);


        if(!btn){

            console.warn(
                "Print button not found:",
                printButtonId
            );

            return;
        }


        btn.addEventListener(
            "click",
            function(e){

                e.preventDefault();

                NivedanRequest.handlePrint(
                    formName
                );

            }
        );

    },


    /* -----------------------------------------------
       PRINT BUTTON
    ------------------------------------------------ */

    handlePrint: async function(formName){

        let requestId =
            localStorage.getItem(
                NivedanRequest.storageKey()
            );


        /* Existing request */

        if(requestId){

            const request =
                await NivedanRequest.getRequest(
                    requestId
                );


            if(request){

                await NivedanRequest.processPrint(
                    requestId,
                    request
                );

                return;
            }
        }


        /* New request */

        NivedanRequest.showPaymentBox(
            formName
        );

    },


    /* -----------------------------------------------
       MOBILE + ESEWA FORM
    ------------------------------------------------ */

    showPaymentBox: function(formName){

        const old =
            document.getElementById(
                "nivedanPaymentModal"
            );

        if(old) old.remove();


        const modal =
        document.createElement("div");

        modal.id =
            "nivedanPaymentModal";


        modal.innerHTML = `

        <div class="nr-overlay">

            <div class="nr-modal">

                <h2>📝 निवेदन दर्ता</h2>

                <p>
                    Print गर्नु अघि आफ्नो
                    विवरण राख्नुहोस्।
                </p>

                <input
                    id="nrName"
                    type="text"
                    placeholder="नाम">

                <input
                    id="nrMobile"
                    type="text"
                    placeholder="Mobile Number">

                <input
                    id="nrEsewa"
                    type="text"
                    placeholder="eSewa Code">

                <button id="nrSaveBtn">
                    SAVE & PRINT
                </button>

                <button
                    id="nrCancelBtn"
                    class="nr-cancel">
                    Cancel
                </button>

            </div>

        </div>

        `;


        document.body.appendChild(modal);


        document.getElementById(
            "nrCancelBtn"
        ).onclick=function(){

            modal.remove();

        };


        document.getElementById(
            "nrSaveBtn"
        ).onclick=function(){

            NivedanRequest.createRequest(
                formName
            );

        };

    },


    /* -----------------------------------------------
       CREATE FIREBASE REQUEST
    ------------------------------------------------ */

    createRequest: async function(formName){

        const name =
            document.getElementById("nrName")
            .value.trim();

        const mobile =
            document.getElementById("nrMobile")
            .value.trim();

        const esewa =
            document.getElementById("nrEsewa")
            .value.trim();


        if(!name){

            alert("नाम राख्नुहोस्।");
            return;
        }


        if(!mobile){

            alert("Mobile Number राख्नुहोस्।");
            return;
        }


        if(!esewa){

            alert("eSewa Code राख्नुहोस्।");
            return;
        }


        const request = {

            name: name,

            mobile: mobile,

            esewa: esewa,

            formName: formName,

            formUrl:
                window.location.pathname,

            status:
                "Pending",

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        };


        try{

            const response =
                await fetch(
                    NIVEDAN_DB +
                    "/requests.json",
                    {

                        method:"POST",

                        headers:{
                            "Content-Type":
                            "application/json"
                        },

                        body:
                        JSON.stringify(request)

                    }
                );


            if(!response.ok){

                throw new Error(
                    "Firebase error"
                );

            }


            const data =
                await response.json();


            const requestId =
                data.name;


            localStorage.setItem(
                NivedanRequest.storageKey(),
                requestId
            );


            document
            .getElementById(
                "nivedanPaymentModal"
            )
            .remove();


            alert(
                "निवेदन Firebase मा save भयो।"
            );


            const savedRequest =
                await NivedanRequest.getRequest(
                    requestId
                );


            await NivedanRequest.processPrint(
                requestId,
                savedRequest
            );


        }catch(error){

            console.error(error);

            alert(
                "❌ Request save भएन। Firebase check गर्नुहोस्।"
            );

        }

    },


    /* -----------------------------------------------
       GET REQUEST
    ------------------------------------------------ */

    getRequest: async function(id){

        try{

            const response =
                await fetch(
                    NIVEDAN_DB +
                    "/requests/" +
                    id +
                    ".json"
                );


            if(!response.ok)
                return null;


            return await response.json();

        }catch(error){

            console.error(error);

            return null;

        }

    },


    /* -----------------------------------------------
       PROCESS PRINT
    ------------------------------------------------ */

    processPrint: async function(
        requestId,
        request
    ){

        if(!request){

            alert("Request भेटिएन।");
            return;
        }


        /* Rejected */

        if(request.status==="Rejected"){

            alert(
                "❌ Payment Reject गरिएको छ।"
            );

            return;
        }


        /* Pending */

        if(request.status==="Pending"){

            NivedanRequest.addWatermark();

            NivedanRequest.showQR(
                requestId
            );


            alert(
                "⚠️ Payment अझै Verify भएको छैन।\n\n"+
                "यो print मा WATERMARK हुनेछ।\n\n"+
                "Admin ले eSewa verify गरेपछि "+
                "clean print गर्न सकिन्छ।"
            );


            window.print();

            return;
        }


        /* Verified */

        if(request.status==="Verified"){

            NivedanRequest.removeWatermark();

            NivedanRequest.showQR(
                requestId
            );


            window.print();


            await NivedanRequest.updateStatus(
                requestId,
                "Printed"
            );

            return;
        }


        /* Printed */

        if(request.status==="Printed"){

            NivedanRequest.removeWatermark();

            NivedanRequest.showQR(
                requestId
            );

            window.print();

        }

    },


    /* -----------------------------------------------
       WATERMARK
    ------------------------------------------------ */

    addWatermark: function(){

        NivedanRequest.removeWatermark();


        const div =
            document.createElement("div");

        div.id =
            "nivedanWatermark";


        div.innerHTML =
            "UNPAID / PAYMENT PENDING";


        document.body.appendChild(div);


        const style =
            document.createElement("style");


        style.id =
            "nivedanWatermarkStyle";


        style.innerHTML = `

        #nivedanWatermark{

            position:fixed;

            top:45%;

            left:10%;

            width:80%;

            text-align:center;

            font-size:55px;

            font-weight:bold;

            color:rgba(200,0,0,.18);

            transform:
            rotate(-25deg);

            z-index:999999;

            pointer-events:none;

        }

        @media print{

            #nivedanWatermark{

                display:block !important;

            }

        }

        `;


        document.head.appendChild(style);

    },


    removeWatermark: function(){

        const w =
            document.getElementById(
                "nivedanWatermark"
            );

        if(w) w.remove();


        const s =
            document.getElementById(
                "nivedanWatermarkStyle"
            );

        if(s) s.remove();

    },


    /* -----------------------------------------------
       QR CODE
       Demo QR using Google Chart API
    ------------------------------------------------ */

    showQR: function(requestId){

        NivedanRequest.removeQR();


        const box =
            document.createElement("div");

        box.id =
            "nivedanQR";


        const trackUrl =
            window.location.origin +
            "/index.html";


        const qrData =
            encodeURIComponent(
                "Nivedan ID: " +
                requestId +
                "\nTrack: " +
                trackUrl
            );


        box.innerHTML = `

            <div class="nr-qr-title">
                NIVEDAN TRACK
            </div>

            <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}"
                alt="QR">

            <div class="nr-qr-id">
                Request Saved
            </div>

        `;


        document.body.appendChild(box);


        const style =
            document.createElement("style");


        style.id =
            "nivedanQRStyle";


        style.innerHTML = `

        #nivedanQR{

            position:fixed;

            right:15px;

            bottom:15px;

            background:white;

            padding:8px;

            border:1px solid #555;

            text-align:center;

            z-index:99999;

            font-family:Arial;

        }

        #nivedanQR img{

            width:100px;

            height:100px;

        }

        .nr-qr-title{

            font-weight:bold;

            font-size:12px;

        }

        .nr-qr-id{

            font-size:9px;

        }

        @media print{

            #nivedanQR{

                display:block;

            }

        }

        `;


        document.head.appendChild(style);

    },


    removeQR: function(){

        const q =
            document.getElementById(
                "nivedanQR"
            );

        if(q) q.remove();


        const s =
            document.getElementById(
                "nivedanQRStyle"
            );

        if(s) s.remove();

    },


    /* -----------------------------------------------
       UPDATE STATUS
    ------------------------------------------------ */

    updateStatus: async function(
        id,
        status
    ){

        try{

            await fetch(
                NIVEDAN_DB +
                "/requests/" +
                id +
                ".json",
                {

                    method:"PATCH",

                    headers:{
                        "Content-Type":
                        "application/json"
                    },

                    body:JSON.stringify({

                        status:status,

                        updatedAt:
                        new Date().toISOString()

                    })

                }
            );

        }catch(error){

            console.error(error);

        }

    },


    /* -----------------------------------------------
       LOCAL STORAGE KEY
    ------------------------------------------------ */

    storageKey: function(){

        return (
            "nivedan_request_" +
            window.location.pathname
        );

    }

};


/* =====================================================
   DEFAULT CSS FOR MODAL
===================================================== */

(function(){

    const style =
        document.createElement("style");


    style.innerHTML = `

    .nr-overlay{

        position:fixed;

        inset:0;

        background:rgba(0,0,0,.6);

        display:flex;

        align-items:center;

        justify-content:center;

        z-index:100000;

    }

    .nr-modal{

        width:90%;

        max-width:420px;

        background:white;

        padding:25px;

        border-radius:12px;

        box-shadow:0 5px 30px #0005;

    }

    .nr-modal h2{

        margin-top:0;

        text-align:center;

    }

    .nr-modal p{

        text-align:center;

    }

    .nr-modal input{

        width:100%;

        padding:13px;

        margin:6px 0;

        border:1px solid #bbb;

        border-radius:7px;

        font-size:16px;

    }

    .nr-modal button{

        width:100%;

        padding:13px;

        margin-top:8px;

        border:0;

        border-radius:7px;

        background:#0b5ed7;

        color:white;

        font-size:16px;

    }

    .nr-modal .nr-cancel{

        background:#777;

    }

    `;


    document.head.appendChild(style);

})();
