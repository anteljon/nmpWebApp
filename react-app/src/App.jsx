/* eslint react-hooks/exhaustive-deps: 0 */ // --> turns eslint warning message off

import React, { useEffect, useState, useRef } from "react";
import socketIOClient from "socket.io-client";

import TypeForm from "./TypeForm";
import TextBox from "./TextBox";
import MpForm from "./MpForm";
import DisplayMp from "./DisplayMp";
import SendEmail from "./SendEmail";

import "./App.scss";

require("dotenv").config({ path: "../.env" });

const socket = socketIOClient();

const App = () => {
  const [state, setState] = useState({
    width: window.innerWidth,
    responseId: "",
    mpData: {
      error: "Please enter your postcode to find your MP",
      name: "",
      full_name: "",
    },
    generatedEmailBody: "Your email will appear here",
    emailSubject: "",
    positiveTypeFormResponseReturned: false,
    greeting: "",
    emailWithGreeting: "",
    emailVisible: false,
    emailSent: false,
  });

  const {
    responseId,
    mpData,
    generatedEmailBody,
    emailSubject,
    greeting,
    emailWithGreeting,
    positiveTypeFormResponseReturned,
    width,
    emailVisible,
    emailSent,
  } = state;

  const displayMpRef = useRef(null);
  const emailBoxRef = useRef(null);

  useEffect(() => {
    socket.on("typeform-incoming", ({ formToken, generatedEmail }) => {
      console.log(generatedEmail);
      if (formToken === responseId) {
        setState({
          ...state,
          generatedEmailBody: generatedEmail.body,
          emailSubject: generatedEmail.subject,
          // mpData: generatedEmail.mpData,
          // greeting: generatedEmail.greeting,
          // emailWithGreeting: generatedEmail.greeting + generatedEmail.body,
          positiveTypeFormResponseReturned: generatedEmail.supportEquity,
        });
      }
    });
  }, [responseId]);

  useEffect(() => {
    if (mpData) {
      const { full_name } = mpData;
      if (full_name) {
        setState({
          ...state,
          greeting: `Dear ${full_name},\n`,
        });
      }
    }
  }, [mpData.name, mpData.full_name]);

  useEffect(() => {
    setState({
      ...state,
      emailWithGreeting: greeting + generatedEmailBody,
    });
  }, [generatedEmailBody, greeting]);

  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://static.addtoany.com/menu/page.js";
    document.body.appendChild(script);
  }, [emailSent]);

  let isMobile = width && width <= 768;

  useEffect(() => {
    setTimeout(() => {
      const { current } = displayMpRef;
      if (current) {
        if (isMobile) {
          if (positiveTypeFormResponseReturned) {
            current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }
      }
    }, 3000);
  }, [displayMpRef, positiveTypeFormResponseReturned]);

  //once the emailBox postcode is rendered on click of 'Continue with this MP', this scrolls the page down to it
  useEffect(() => {
    const { current } = emailBoxRef;
    current &&
      current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
  }, [emailVisible, emailBoxRef]);

  const passDataUpstream = (data) => {
    Object.keys(data).forEach((key) => {
      setState({ ...state, [key]: data[key] });
    });
  };

  return (
    <div className="main">
      <IntroContent />

      <div className="typeform">
        <TypeForm passDataUpstream={passDataUpstream} isMobile={isMobile} />
      </div>

      {positiveTypeFormResponseReturned && (
        <>
          <div ref={displayMpRef}>
            <DisplayMp mpData={mpData} />
          </div>

          <div id="mpForm" className="">
            <MpForm passDataUpstream={passDataUpstream} />
          </div>
          {emailVisible && (
            <div>
              <div ref={emailBoxRef}>
                <TextBox
                  passDataUpstream={passDataUpstream}
                  emailBody={emailWithGreeting}
                  subject={emailSubject}
                />
              </div>
              <div className="">
                <SendEmail
                  mpEmailAddress={mpData.mpEmailAddress}
                  body={emailWithGreeting}
                  subject={emailSubject}
                  passDataUpstream={passDataUpstream}
                />
              </div>
              {emailSent && <h2 className="secondary-header">Thankyou!</h2>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
