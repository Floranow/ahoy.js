import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Cookies from './cookies-mobile';
import axios from 'axios'
import { Dimensions } from 'react-native'


const AhoyContextLocal = createContext({
  ahoy: {},
});

const AhoyProvider = ({ customConfig, children }) => {
  let config = {
    urlPrefix: "",
    visitsUrl: "/ahoy/visits",
    eventsUrl: "/ahoy/events",
    page: null,
    platform: "Web",
    useBeacon: true,
    startOnReady: true,
    trackVisits: true,
    cookies: true,
    cookieDomain: null,
    headers: {},
    visitParams: {},
    withCredentials: false,
    visitDuration: 4 * 60, // default 4 hours
    visitorDuration: 2 * 365 * 24 * 60,// default 2 years,
    ...customConfig
  };

  const [ahoy, setAhoy] = useState(config);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tempAhoy = {
      ...ahoy, configure: function (options) {
        for (let key in options) {
          if (options.hasOwnProperty(key)) {
            config[key] = options[key];
          }
        }
      }
    };
    setAhoy(tempAhoy);
    tempAhoy.configure(ahoy);

  }, [])


  // legacy

  // let $ = window.jQuery || window.Zepto || window.$;
  let visitId, visitorId, track;
  let queue = [];
  let canStringify = typeof (JSON) !== "undefined" && typeof (JSON.stringify) !== "undefined";
  let eventQueue = [];

  function visitsUrl() {
    return config.urlPrefix + config.visitsUrl;
  }

  function eventsUrl() {
    return config.urlPrefix + config.eventsUrl;
  }

  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  function canTrackNow() {
    return (config.useBeacon || config.trackNow) && isEmpty(config.headers) && canStringify && /* typeof (window.navigator.sendBeacon) !== "undefined" && */ !config.withCredentials;
  }

  function serialize(object) {
    let data = new FormData();
    for (let key in object) {
      if (object.hasOwnProperty(key)) {
        data.append(key, object[key]);
      }
    }
    return data;
  }

  // cookies

  function setCookie(name, value, ttl) {
    return Cookies.set(name, value, ttl, config.cookieDomain || config.domain);
  }

  function getCookie(name) {
    return Cookies.get(name, config.cookieDomain);
  }

  function destroyCookie(name) {
    Cookies.set(name, "", -1);
  }

  function log(message) {
    // if (await getCookie("ahoy_debug")) {
    console.log(message);
    //}
  }

  function setReady(value) {
    let callback;
    log('1')
    while ((callback = queue.shift())) {
      callback();
    }
    log('2')
    setIsReady(value);
  }
  useEffect(() => {
    console.log("isReady : ", isReady);
    ahoy.isReady = isReady;
    const tempAhoy = {
      ...ahoy, 
    };
    setAhoy(tempAhoy);
  }, [isReady])
  useEffect(() => {      log('ready : ' )

    ahoy.ready =(callback) => {
      log('ready : ' )
      log('ready : ' + ahoy.isReady)
      if (true) {
        callback();
      } else {
        queue.push(callback);
      }
    };
    const tempAhoy = {
      ...ahoy, isReadyInit: true
    };
    setAhoy(tempAhoy);
  }, [])
 

  // ahoy.ready = function (callback) {
  //   log('ready fun')
  //   if (isReady) {
  //     log('ready :', isReady)

  //     callback();
  //   } else {
  //     queue.push(callback);
  //   }
  // };

  function matchesSelector(element, selector) {
    let matches = element.matches ||
      element.matchesSelector ||
      element.mozMatchesSelector ||
      element.msMatchesSelector ||
      element.oMatchesSelector ||
      element.webkitMatchesSelector;

    if (matches) {
      if (matches.apply(element, [selector])) {
        return element;
      } else if (element.parentElement) {
        return matchesSelector(element.parentElement, selector);
      }
      return null;
    } else {
      log("Unable to match");
      return null;
    }
  }

  // function onEvent(eventName, selector, callback) {
  //     document.addEventListener(eventName, function (e) {
  //         let matchedElement = matchesSelector(e.target, selector);
  //         if (matchedElement) {
  //             callback.call(matchedElement, e);
  //         }
  //     });
  // }

  // http://beeker.io/jquery-document-ready-equivalent-vanilla-javascript
  // function documentReady(callback) {
  //     if (document.readyState === "interactive" || document.readyState === "complete") {
  //         setTimeout(callback, 0);
  //     } else {
  //         document.addEventListener("DOMContentLoaded", callback);
  //     }
  // }

  // https://stackoverflow.com/a/2117523/1177228
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function saveEventQueue() {
    if (config.cookies && canStringify) {
      setCookie("ahoy_events", JSON.stringify(eventQueue), 1);
    }
  }

  // from rails-ujs

  function csrfToken() {
    let meta = null;//document.querySelector("meta[name=csrf-token]");
    return meta && meta.content;
  }

  function csrfParam() {
    let meta = null;//document.querySelector("meta[name=csrf-param]");
    return meta && meta.content;
  }

  function CSRFProtection(xhr) {
    let token = csrfToken();
    if (token) xhr.setRequestHeader("X-CSRF-Token", token);
  }

  function sendRequest(url, data, success) {
    if (canStringify) {
      console.log("URL  :  ", url)
      console.log("data  :  ", data)
      console.log("success  :  ", success)
      axios.post(url, JSON.stringify(data), {
        headers: {
          ...config.headers, contentType: "application/json; charset=utf-8",
        },
        withCredentials: config.withCredentials,
      })
        .then(function (response) {
          console.log("aaaaa : ",JSON.stringify(response));
          if (response.status === 200) { success && success(); }
        })
        .catch(function (error) {
          console.log(error);
        });

      // if ($ && $.ajax) {
      //     $.ajax({
      //         type: "POST",
      //         url: url,
      //         data: JSON.stringify(data),
      //         contentType: "application/json; charset=utf-8",
      //         dataType: "json",
      //         beforeSend: CSRFProtection,
      //         success: success,
      //         headers: config.headers,
      //         xhrFields: {
      //             withCredentials: config.withCredentials
      //         }
      //     });
      // } else {
      //     let xhr = new XMLHttpRequest();
      //     xhr.open("POST", url, true);
      //     xhr.withCredentials = config.withCredentials;
      //     xhr.setRequestHeader("Content-Type", "application/json");
      //     for (let header in config.headers) {
      //         if (config.headers.hasOwnProperty(header)) {
      //             xhr.setRequestHeader(header, config.headers[header]);
      //         }
      //     }
      //     xhr.onload = function () {
      //         if (xhr.status === 200) {
      //             success();
      //         }
      //     };
      //     CSRFProtection(xhr);
      //     xhr.send(JSON.stringify(data));
      // }
    }
  }

  function eventData(event) {
    let data = {
      events: [event]
    };
    if (config.cookies) {
      data.visit_token = event.visit_token;
      data.visitor_token = event.visitor_token;
    }
    delete event.visit_token;
    delete event.visitor_token;
    return data;
  }

  function trackEvent(event) {
    ahoy.ready(function () {
      sendRequest(eventsUrl(), eventData(event), function () {
        // remove from queue
        for (let i = 0; i < eventQueue.length; i++) {
          if (eventQueue[i].id == event.id) {
            eventQueue.splice(i, 1);
            break;
          }
        }
        saveEventQueue();
      });
    });
  }

  function trackEventNow(event) {
    ahoy.ready(function () {
      let data = eventData(event);
      let param = csrfParam();
      let token = csrfToken();
      if (param && token) data[param] = token;
      // stringify so we keep the type
      data.events_json = JSON.stringify(data.events);
      delete data.events;
      axios.post(eventsUrl(), serialize(data), {
        headers: {
          ...config.headers, contentType: "application/json; charset=utf-8",
        },
        withCredentials: config.withCredentials,
      })
        .then(function (response) {
          console.log(response);
          if (response.status === 200) { success && success(); }
        })
        .catch(function (error) {
          console.log(error);
        });
      // window.navigator.sendBeacon(eventsUrl(), serialize(data));
    });
  }

  function page() {
    return config.page;//|| window.location.pathname;
  }

  // function presence(str) {
  //     return (str && str.length > 0) ? str : null;
  // }

  // function cleanObject(obj) {
  //     for (let key in obj) {
  //         if (obj.hasOwnProperty(key)) {
  //             if (obj[key] === null) {
  //                 delete obj[key];
  //             }
  //         }
  //     }
  //     return obj;
  // }

  // function eventProperties() {
  //     return cleanObject({
  //         tag: this.tagName.toLowerCase(),
  //         id: presence(this.id),
  //         "class": presence(this.className),
  //         page: page(),
  //         section: getClosestSection(this)
  //     });
  // }

  // function getClosestSection(element) {
  //     for (; element && element !== document; element = element.parentNode) {
  //         if (element.hasAttribute('data-section')) {
  //             return element.getAttribute('data-section');
  //         }
  //     }

  //     return null;
  // }

  function createVisit() {
    // isReady = false;
    // setIsReady(false);
    log("360")
    ahoy.getVisitId().then((visitId) => {
      log("362")
      ahoy.getVisitorId().then((visitorId) => {
        log("364")
        log(visitId)
        log(visitorId)
        getCookie("ahoy_track").then((track) => {
          log("368")
          if (config.cookies === false || config.trackVisits === false) {
            log("367")
            setReady(true);
          } else if (visitId && visitorId && !track) {
            log("373")
            // TODO keep visit alive?
            setReady(true);
          } else {
            log("377")
            if (!visitId) {
              log("379")
              visitId = generateId();
              console.log("Before  visitId : ", visitId)
              console.log("Before  config.visitDuration : ", config.visitDuration)

              setCookie("ahoy_visit", visitId, config.visitDuration).then((ahoy_visit) => {
                log("385")
                console.log("AFTER COOKEL")
                getCookie("ahoy_visit").then((ahoy_visit) => {
                  log("388")
                  console.log("AFTER COOKEL , ", ahoy_visit)

                  if (ahoy_visit) {
                    log("392")
                    if (!visitorId) {
                      log("394")
                      visitorId = generateId();
                      setCookie("ahoy_visitor", visitorId, config.visitorDuration);
                    }

                    log("399")
                    let data = {
                      visit_token: visitId,
                      visitor_token: visitorId,
                      platform: config.platform,
                      landing_page: 'mobile',
                      screen_width: Dimensions.get('window').width,
                      screen_height: Dimensions.get('window').height,
                      js: true
                    };

                    log("410")
                    // referrer
                    // if (document.referrer.length > 0) {
                    //     data.referrer = 'mobile';// document.referrer;
                    // }

                    for (let key in config.visitParams) {
                      if (config.visitParams.hasOwnProperty(key)) {
                        data[key] = config.visitParams[key];
                      }
                    }

                    sendRequest(visitsUrl(), data, function () {
                      // wait until successful to destroy
                      destroyCookie("ahoy_track");
                      setReady(true);
                    });
                  } else {
                    log("Cookies disabled");
                    setReady(true);
                  }
                })
              })
            } else {
              log("434")
              log("!!visitId")
              // make sure cookies are enabled
              getCookie("ahoy_visit").then((ahoy_visit) => {
                if (ahoy_visit) {
                  if (!visitorId) {
                    visitorId = generateId();
                    setCookie("ahoy_visitor", visitorId, config.visitorDuration);
                  }

                  let data = {
                    visit_token: visitId,
                    visitor_token: visitorId,
                    platform: config.platform,
                    landing_page: 'mobile',
                    screen_width: Dimensions.get('window').width,
                    screen_height: Dimensions.get('window').height,
                    js: true
                  };

                  // referrer
                  // if (document.referrer.length > 0) {
                  //     data.referrer = 'mobile';// document.referrer;
                  // }

                  for (let key in config.visitParams) {
                    if (config.visitParams.hasOwnProperty(key)) {
                      data[key] = config.visitParams[key];
                    }
                  }


                  sendRequest(visitsUrl(), data, function () {
                    // wait until successful to destroy
                    destroyCookie("ahoy_track");
                    setReady(true);
                  });
                } else {
                  log("Cookies disabled");
                  setReady(true);
                }
              })
            }
          }
        });
      })
    })


  }

  useEffect(() => {

    ahoy.getVisitId = function () {
      return getCookie("ahoy_visit");
    }
    ahoy.getVisitToken = function () {
      return getCookie("ahoy_visit");
    }
    ahoy.getVisitorId = function () {
      return getCookie("ahoy_visitor");
    };
    ahoy.getVisitorToken = function () {
      return getCookie("ahoy_visitor");
    };
    ahoy.reset = function () {
      destroyCookie("ahoy_visit");
      destroyCookie("ahoy_visitor");
      destroyCookie("ahoy_events");
      destroyCookie("ahoy_track");
      return true;
    }
    ahoy.debug = function (enabled) {
      if (enabled === false) {
        destroyCookie("ahoy_debug");
      } else {
        setCookie("ahoy_debug", "t", 365 * 24 * 60); // 1 year
      }
      return true;
    }
    const tempAhoy = {
      ...ahoy,
    };
    setAhoy(tempAhoy);
  }, [])
  useEffect(() => {
    if (ahoy.ready && ahoy.getVisitId && ahoy.getVisitorId) {
      ahoy.track = function (name, properties) {
        // generate unique id
        console.log("name : ", name)
        console.log("properties : ", properties)
        let event = {
          name: name,
          properties: properties || {},
          time: (new Date()).getTime() / 1000.0,
          id: generateId(),
          js: true
        };
        console.log("515")

        ahoy.ready(function () {
          console.log("518")
          ahoy.getVisitId().then((visitId) => {
            console.log("519")

            if (config.cookies && !visitId) {
              console.log("521")

              createVisit();
            }

            ahoy.ready(function () {
              console.log("527")

              log(event);
              ahoy.getVisitId().then((visitId) => {
                ahoy.getVisitorId().then((visitorId) => {

                  event.visit_token = visitId;
                  event.visitor_token = visitorId;

                  if (canTrackNow()) {
                    trackEventNow(event);
                  } else {
                    eventQueue.push(event);
                    saveEventQueue();

                    // wait in case navigating to reduce duplicate events
                    setTimeout(function () {
                      trackEvent(event);
                    }, 1000);
                  }
                });
              });
            });
          })

        });

        return true;
      }
      const tempAhoy = {
        ...ahoy,
      };
      setAhoy(tempAhoy);
      // tempAhoy.ready(ahoy);
      // ahoy.ready(ahoy);

    }
  }, [ahoy.ready, ahoy.getVisitId, ahoy.getVisitorId])
  useEffect(() => {
    if (ahoy.track) {
      ahoy.trackView = function (additionalProperties) {
        let properties = {
          url: additionalProperties.url,
          title: additionalProperties.title,
          page: page()
        };

        if (additionalProperties) {
          for (let propName in additionalProperties) {
            if (additionalProperties.hasOwnProperty(propName)) {
              properties[propName] = additionalProperties[propName];
            }
          }
        }
        ahoy.track("$view", properties);
      };
      ahoy.start =
        function () {
          createVisit();

          setAhoy({ ...ahoy, start: function () { } });
        };
      const tempAhoy = {
        ...ahoy,
      };
      setAhoy(tempAhoy);
      // tempAhoy.ready(ahoy);
    }
  }, [ahoy.track])


  // ahoy.getVisitId = ahoy.getVisitToken = async function () {
  //   return await getCookie("ahoy_visit");
  // };

  // ahoy.getVisitorId = ahoy.getVisitorToken = async function () {
  //   return await getCookie("ahoy_visitor");
  // };

  // ahoy.reset = function () {
  //   destroyCookie("ahoy_visit");
  //   destroyCookie("ahoy_visitor");
  //   destroyCookie("ahoy_events");
  //   destroyCookie("ahoy_track");
  //   return true;
  // };

  // ahoy.debug = function (enabled) {
  //   if (enabled === false) {
  //     destroyCookie("ahoy_debug");
  //   } else {
  //     setCookie("ahoy_debug", "t", 365 * 24 * 60); // 1 year
  //   }
  //   return true;
  // };

  // ahoy.track = function (name, properties) {
  //   // generate unique id
  //   let event = {
  //     name: name,
  //     properties: properties || {},
  //     time: (new Date()).getTime() / 1000.0,
  //     id: generateId(),
  //     js: true
  //   };

  //   ahoy.ready(function () {
  //     if (config.cookies && !ahoy.getVisitId()) {
  //       createVisit();
  //     }

  //     ahoy.ready(function () {
  //       log(event);

  //       event.visit_token = ahoy.getVisitId();
  //       event.visitor_token = ahoy.getVisitorId();

  //       if (canTrackNow()) {
  //         trackEventNow(event);
  //       } else {
  //         eventQueue.push(event);
  //         saveEventQueue();

  //         // wait in case navigating to reduce duplicate events
  //         setTimeout(function () {
  //           trackEvent(event);
  //         }, 1000);
  //       }
  //     });
  //   });

  //   return true;
  // };

  // ahoy.trackView = function (additionalProperties) {
  //   let properties = {
  //     url: additionalProperties.url,
  //     title: additionalProperties.title,
  //     page: page()
  //   };

  //   if (additionalProperties) {
  //     for (let propName in additionalProperties) {
  //       if (additionalProperties.hasOwnProperty(propName)) {
  //         properties[propName] = additionalProperties[propName];
  //       }
  //     }
  //   }
  //   ahoy.track("$view", properties);
  // };

  // ahoy.trackClicks = function (selector) {
  //     if (selector === undefined) {
  //         throw new Error("Missing selector");
  //     }
  //     onEvent("click", selector, function (e) {
  //         let properties = eventProperties.call(this, e);
  //         properties.text = properties.tag == "input" ? this.value : (this.textContent || this.innerText || this.innerHTML).replace(/[\s\r\n]+/g, " ").trim();
  //         properties.href = this.href;
  //         ahoy.track("$click", properties);
  //     });
  // };

  // ahoy.trackSubmits = function (selector) {
  //     if (selector === undefined) {
  //         throw new Error("Missing selector");
  //     }
  //     onEvent("submit", selector, function (e) {
  //         let properties = eventProperties.call(this, e);
  //         ahoy.track("$submit", properties);
  //     });
  // };

  // ahoy.trackChanges = function (selector) {
  //     log("trackChanges is deprecated and will be removed in 0.5.0");
  //     if (selector === undefined) {
  //         throw new Error("Missing selector");
  //     }
  //     onEvent("change", selector, function (e) {
  //         let properties = eventProperties.call(this, e);
  //         ahoy.track("$change", properties);
  //     });
  // };

  // push events from queue
  try {
    getCookie("ahoy_events").then((ahoy_events) => {
      eventQueue = JSON.parse(ahoy_events || "[]");
    })
  } catch (e) {
    // do nothing
  }

  for (let i = 0; i < eventQueue.length; i++) {
    trackEvent(eventQueue[i]);
  }

  // ahoy.start = function () {
  //   createVisit();

  //   ahoy.start = function () { };
  // };


  useEffect(() => {
    // log('useEffect : ', config)
    if (config.startOnReady && ahoy.start) {
      ahoy.start();
    }
  }, [ahoy.start])


  return (
    <AhoyContextLocal.Provider
      value={{
        ahoy: ahoy,
      }}>
      {children}
    </AhoyContextLocal.Provider>
  );
};

export const useAhoy = () => {
  const context = useContext(AhoyContextLocal);

  if (!context) {
    throw new Error('You forgot Ahoy provider!');
  }

  return context;
};
export const AhoyContext = AhoyContextLocal;
export default AhoyProvider;
