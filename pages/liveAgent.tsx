import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import {
  AiOutlineSend,
  AiOutlineClose,
  AiFillStar,
  AiOutlineStar,
} from 'react-icons/ai';
import { Document } from 'langchain/document';
import LoadingIcons from 'react-loading-icons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const LiveAgent = () => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceDocs, setSourceDocs] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [apiMessage, setApiMessage] = useState('');

  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, what would you like to learn about DFCC Bank?',
        type: 'apiMessage',
      },
    ],
    history: [],
    pendingSourceDocs: [],
  });

  const { messages, pending, history, pendingSourceDocs } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('ENGLISH');
  const [id, setId] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState(0);
  const [hover, setHover] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showChatRating, setShowChatRating] = useState(false);

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  useEffect(() => {
    const now = Date.now();
    const newId = now.toString();
    setId('Live' + newId);
  }, []);
  console.log('user id : ', id);

  useEffect(() => {
    console.log('----------', id);
    const interval = setInterval(async () => {
      const response = await fetch('http://localhost:5000/live-chat-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: id }),
      });

      if (response.status !== 200) {
        const error = await response.json();
        throw new Error(error.message);
      }
      const data = await response.json();
      console.log('response : ', data.agentMessage);
      console.log('chat status : ', data.chatStatus);

      setMessageState((state) => ({
        ...state,
        messages: [
          ...state.messages,
          {
            type: 'userMessage',
            message: data.agentMessage,
          },
        ],
        pending: undefined,
      }));

      if(data.chatStatus === "closed"){
        setShowChatRating(true);
      }
      else{
        setShowChatRating(false);
      }

    }, 5000);

    // {data && (
    //     <p>{data.message}</p>
    //   )}

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    console.log(selectedLanguage);
    console.log('useEffect : ', apiMessage);
  }, [selectedLanguage, apiMessage]);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }
    // get user message
    let question = query.trim();
    console.log('question from user : ', question);

    // set user message array
    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
      pending: undefined,
    }));

    setLoading(true);
    setQuery('');
    setMessageState((state) => ({ ...state, pending: '' }));

    // send user message
    const response = await fetch('http://localhost:5000/live-chat-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_Message: question,
        chatId: id,
      }),
    });

    if (response.status !== 200) {
      const error = await response.json();
      throw new Error(error.message);
    }
    const data = await response.json();
    setAlertMessage(data.success);
    setLoading(false);
    setShowAlert(true);

    console.log('response : ', data.success);

    const ctrl = new AbortController();
  }

  //prevent empty submissions
  const handleEnter = useCallback(
    (e: any) => {
      if (e.key === 'Enter' && query) {
        handleSubmit(e);
      } else if (e.key == 'Enter') {
        e.preventDefault();
      }
    },
    [query],
  );

  const chatMessages = useMemo(() => {
    return messages.filter(
      (message) =>
        message.type === 'userMessage' || message.message !== undefined,
    );
  }, [messages]);

  console.log('messages : ', messages);

  //scroll to bottom of chat
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  async function sendRateValues() {
    // const sendData = async (botName, index) => {
    try {
      const response = await fetch('http://localhost:5000/save-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: id,
          ratingValue: rating,
          feedbakMessage: inputValue,
        }),
      });
      const ratingData = await response.json();
      // console.log(ratingData)
    } catch (error) {
      console.error(error);
    }
    // }
    // console.log(inputValue);
    // console.log(rating);
  }

  return (
    <Layout>
      {/* chat top header */}
      <div className={`${styles.chatTopBar} d-flex flex-row`}>
        <div className="col-12 text-center d-flex flex-row justify-content-between px-2 px-lg-5">
          <Image src="/chat-top-bar.png" alt="AI" width={150} height={30} />
        </div>
      </div>
      {showAlert && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <p>Please wait...</p>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
            onClick={handleCloseAlert}
          ></button>
        </div>
      )}

      <div className={`${styles.messageWrapper}`}>
        <div
          ref={messageListRef}
          className={`${styles.messageContentWrapper} d-flex flex-column`}
        >
          {chatMessages.map((message, index) => {
            let icon;
            let className;
            let userHomeStyles;
            let wrapper = 'align-items-end justify-content-end';
            let userStyles = 'justify-content-end flex-row-reverse float-end';
            if (message.type === 'apiMessage') {
              icon = (
                <Image
                  src="/chat-header.png"
                  alt="AI"
                  width="40"
                  height="40"
                  className={styles.botImage}
                  priority
                />
              );
              className = styles.apimessage;
              userStyles = 'justify-content-start flex-row float-start';
              wrapper = 'align-items-start justify-content-start';
            } else {
              icon = (
                <Image
                  src="/user.png"
                  alt="Me"
                  width="40"
                  height="40"
                  className={styles.botImage}
                  priority
                />
              );
              userHomeStyles = styles.userApiStyles;
              // The latest message sent by the user will be animated while waiting for a response
              className =
                loading && index === chatMessages.length - 1
                  ? styles.usermessagewaiting
                  : styles.usermessage;
            }
            return (
              <>
                <div
                  key={`chatMessage-${index}`}
                  className={styles.botMessageContainerWrapper}
                >
                  <div
                    className={`${styles.botChatMsgContainer} ${userStyles} d-flex my-2`}
                  >
                    <div className="d-flex">{icon}</div>
                    <div className={`${wrapper} d-flex flex-column ms-2`}>
                      <div
                        className={`${styles.botMessageContainer} ${userHomeStyles} d-flex flex-column my-1`}
                      >
                        <p className="mb-0">{message.message}</p>
                      </div>
                      {/* <p className={`${styles.timeText} text-start  mt-2`}>{time}</p> */}
                    </div>
                  </div>
                </div>
              </>
            );
          })}
          {showChatRating && (
            <div className="d-flex flex-column" id='chatRating'>
            <div className="d-flex">
              <Image src="/chat-header.png" alt="AI" width="40" height="40" />
            </div>
            <div className={`d-flex flex-column px-1 py-2 p-lg-0  ms-lg-2`}>
              <div
                className={`welcomeMessageContainer d-flex flex-column align-items-center align-items-lg-start  my-lg-1`}
              >
                <div className="container-fluid m-0 p-0">
                  <div
                    className={`${styles.botRateRequest} d-flex flex-row my-2 mx-2`}
                  >
                    <div
                      className={`${styles.botRatingContainer} d-flex flex-column my-1`}
                    >
                      <p className={`${styles.rateTitle} mb-0 text-dark`}>
                        Rate your conversation
                      </p>
                      <p className="text-dark mb-0">Add your rating</p>
                      <div className="star-rating">
                        {[...Array(5)].map((star, index) => {
                          index += 1;
                          return (
                            <button
                              type="button"
                              key={index}
                              className={
                                index <= (hover || rating) ? 'on' : 'off'
                              }
                              onClick={() => {
                                setRating(index);
                              }}
                              onMouseEnter={() => setHover(index)}
                              onMouseLeave={() => setHover(rating)}
                            >
                              <span className="star">&#9733;</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className={` mb-0 mt-3 text-dark`}>Your feedback :</p>
                      <textarea
                        className={`${styles.textarea} p-2 rounded`}
                        rows={3}
                        maxLength={512}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                      />

                      <button
                        onClick={sendRateValues}
                        className="text-white bg-dark p-2 mt-2 rounded"
                      >
                        SEND
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* <p className={`${styles.timeText} text-start  mt-2`}>{time}</p> */}
            </div>
          </div>
          )
          }
        </div>
      </div>

      {/* input fields =================*/}
      <div className={`${styles.inputContainer}`}>
        <form onSubmit={handleSubmit}>
          <textarea
            disabled={loading}
            onKeyDown={handleEnter}
            ref={textAreaRef}
            autoFocus={false}
            rows={1}
            maxLength={512}
            id="userInput"
            name="userInput"
            placeholder={
              loading
                ? 'Waiting for response...'
                : 'What is this question about?'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.textarea}
          />
          <button
            type="submit"
            disabled={loading}
            className={`${styles.inputIconContainer} `}
          >
            {loading ? (
              <div className={styles.loadingwheel}>
                <LoadingDots color="#fff" />
                {/* <LoadingIcons.ThreeDots /> */}
              </div>
            ) : (
              // Send icon SVG in input field
              <AiOutlineSend className={styles.sendIcon} />
            )}
          </button>
        </form>
      </div>
      {error && (
        <div className="border border-red-400 rounded-md p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      {/* input fields ================= */}
    </Layout>
  );
};

export default LiveAgent;
