const GITHUB_PULLS_URL = "https://github.com/pulls";

if (!location.href.startsWith(GITHUB_PULLS_URL)) {
  location = GITHUB_PULLS_URL;
  return;
}

const ID_PREFIX = "GPSH";
const ID_TOGGLE_BUTTON = ID_PREFIX + "-toggle-button";

if (document.getElementById(ID_TOGGLE_BUTTON)) {
  return;
}

const VERSION = "v1.0.0";
const COMPANY_NAME = "Asana";

const ID_VERSION_TOOLTIP = ID_PREFIX + "-version-tooltip";
const ID_SEARCH_TOOL_BAR = ID_PREFIX + "-search-toolbar";
const ID_STATUS_DROPDOWN = ID_PREFIX + "-status-dropdown";
const ID_USERNAME_PREDICATE_DROPDOWN = ID_PREFIX + "-username-predicate";
const ID_TYPEAHEAD_RESULT_CONTAINER = ID_PREFIX + "-typeahead-result-container";
const ID_USERNAME_SEARCH_INPUT = ID_PREFIX + "-username-search-input";
const ID_TYPEAHEAD_RESULT_ITEM_PREFIX = ID_PREFIX + "-typeahead-result-item";
const ID_TEXT_SEARCH_INPUT = ID_PREFIX + "-text-search-input";

////////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////////

function main() {
  const githubSearchBar = document.querySelector(
    "#issues_dashboard > div.subnav.d-flex.mb-3.flex-column.flex-md-row"
  );

  const toggleButton = createToggleButton();
  githubSearchBar.before(toggleButton);

  const versionTooltip = createVersionTooltip();
  toggleButton.after(versionTooltip);

  const searchToolbar = createElement("div", {
    id: ID_SEARCH_TOOL_BAR,
    style: css_searchToolbar,
  });
  toggleButton.after(searchToolbar);

  const statusDropdown = createSelect(
    [
      { label: "Open", value: "open" },
      { label: "Closed", value: "closed" },
      { label: "Merged", value: "merged" },
      { label: "Draft", value: "draft" },
      { label: "None", value: "" },
    ],
    ID_STATUS_DROPDOWN
  );
  searchToolbar.appendChild(statusDropdown);

  const usernamePredicateDropdown = createSelect(
    [
      { label: "Created by", value: "author" },
      { label: "Assigned to", value: "assignee" },
      { label: "Mentions", value: "mentions" },
      { label: "Review requested", value: "review-requested" },
      { label: "None", value: "" },
    ],
    ID_USERNAME_PREDICATE_DROPDOWN
  );
  searchToolbar.appendChild(usernamePredicateDropdown);

  const usernameSearchInput = createUsernameSearchInput();
  searchToolbar.appendChild(usernameSearchInput);

  const typeaheadResultContainer = createElement("div", {
    id: ID_TYPEAHEAD_RESULT_CONTAINER,
    style: css_typeaheadResultContainer,
  });
  searchToolbar.append(typeaheadResultContainer);

  const textSearchInput = createTextSearchInput();
  searchToolbar.appendChild(textSearchInput);

  const searchButton = createSearchButton();
  searchToolbar.appendChild(searchButton);
}

////////////////////////////////////////////////////////////
// CREATE ELEMENT HELPERS
////////////////////////////////////////////////////////////

function createToggleButton() {
  const button = createElement("button", {
    id: ID_TOGGLE_BUTTON,
    style: css_toggleOn,
  });
  button.innerHTML = "Toggle";

  button.onclick = (event) => {
    event.preventDefault();
    const searchToolbar = getSearchToolbar();

    if (searchToolbar.style.visibility === "visible") {
      hideElement(searchToolbar);
      button.style.cssText = css_toggleOff;
    } else {
      showElement(searchToolbar);
      button.style.cssText = css_toggleOn;
      getUsernameSearchInput().focus();
    }
  };

  button.onmouseenter = () => {
    const versionTooltip = getVersionTooltip();
    versionTooltip.style.transitionDelay = "0.5s";
    showElement(versionTooltip);
  };

  button.onmouseleave = () => {
    const versionTooltip = getVersionTooltip();
    versionTooltip.style.transitionDelay = "0s";
    hideElement(getVersionTooltip());
  };

  return button;
}

function createVersionTooltip() {
  const tooltip = createElement("div", {
    id: ID_VERSION_TOOLTIP,
    style: css_versionTooltip,
  });
  tooltip.innerHTML = VERSION;
  return tooltip;
}

function createSelect(selectOptions, id) {
  const select = createElement("select", { id, style: css_select });

  for (let { value, label } of selectOptions) {
    select.appendChild(createElement("option", { value, label }));
  }

  return select;
}

function createUsernameSearchInput() {
  const input = createElement("input", {
    id: ID_USERNAME_SEARCH_INPUT,
    style: css_usernameSearchInput,
    placeholder: "Search for username...",
  });

  const inputHandler = debounce((e) => {
    const typeaheadResultContainer = getTypeaheadResultContainer();
    showElement(typeaheadResultContainer);
    typeaheadResultContainer.textContent = "Loading ...";

    if (e.target.value.trim() === "") {
      hideElement(typeaheadResultContainer);
      return;
    }

    function addUsernameToInput(username, typeaheadResultContainer) {
      const usernameInput = getUsernameSearchInput();
      usernameInput.value = username;
      removeChildren(typeaheadResultContainer);
      hideElement(typeaheadResultContainer);
    }

    searchUsers(e.target.value)
      .then((userData) => {
        const typeaheadResultContainer = getTypeaheadResultContainer();
        removeChildren(typeaheadResultContainer);

        if (userData.length === 0) {
          typeaheadResultContainer.textContent = "No results found";
          return;
        }

        userData.forEach(({ username, img }, index) => {
          const resultListItem = createElement("div", {
            id: `${ID_TYPEAHEAD_RESULT_ITEM_PREFIX}-${index}`,
            style: css_typeaheadResultItem,
            tabindex: 0,
          });

          resultListItem.onclick = () => {
            addUsernameToInput(username, typeaheadResultContainer);
          };
          resultListItem.onkeydown = (e) => {
            switch (e.key) {
              case "Enter":
                addUsernameToInput(username, typeaheadResultContainer);
                return;
              case "ArrowDown":
                e.preventDefault();
                e.target.nextElementSibling?.focus();
                return;
              case "ArrowUp":
                e.preventDefault();
                if (e.target.parentElement.firstChild === e.target) {
                  getUsernameSearchInput().focus();
                } else {
                  e.target.previousElementSibling.focus();
                }
                return;
            }
          };
          resultListItem.onmouseenter = () =>
            (resultListItem.style.background = SELECTED_BG);
          resultListItem.onmouseleave = () =>
            (resultListItem.style.background = GITHUB_BG);

          img.style.cssText = css_typeaheadResultAvatar;
          resultListItem.appendChild(img);

          const text = document.createElement("span");
          text.textContent = username;
          resultListItem.appendChild(text);

          typeaheadResultContainer.append(resultListItem);
        });
      })
      .catch((err) => {
        console.error(err);

        const typeaheadResultContainer = getTypeaheadResultContainer();
        removeChildren(typeaheadResultContainer);

        const errorContainer = createElement("div");

        if (err.message === "require-sso") {
          const requireSsoMessage = createRequireSsoMessage();
          errorContainer.appendChild(requireSsoMessage);
        } else {
          const errorMessage = createElement("span", {
            style: "color: #982525",
          });
          errorMessage.innerText = `Error: ${err.message}`;
          errorContainer.appendChild(errorMessage);
        }

        typeaheadResultContainer.appendChild(errorContainer);
      });
  }, 250);

  input.oninput = inputHandler;
  input.onblur = (e) => {
    const focusedTarget = e.relatedTarget;
    if (!focusedTarget?.id.startsWith(ID_TYPEAHEAD_RESULT_ITEM_PREFIX)) {
      hideElement(getTypeaheadResultContainer());
    }
  };
  input.onfocus = () => {
    const typeaheadResultContainer = getTypeaheadResultContainer();
    if (
      input.value.length > 0 &&
      typeaheadResultContainer.childElementCount > 0
    ) {
      showElement(typeaheadResultContainer);
    }
  };
  input.onkeydown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.target.nextElementSibling.firstChild.focus();
    }
  };

  return input;
}

function createTextSearchInput() {
  const input = createElement("input", {
    id: ID_TEXT_SEARCH_INPUT,
    style: css_textSearchInput,
    placeholder: "Search for text...",
  });

  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      executeSearch();
    }
  };
  return input;
}

function createSearchButton() {
  const button = createElement("button", {
    style: css_searchButton,
  });
  button.textContent = "Search";
  button.onclick = (event) => {
    event.preventDefault();
    executeSearch();
  };

  return button;
}

function createRequireSsoMessage() {
  const errorCTA = createElement("span");
  const ssoLink = `https://github.com/orgs/${COMPANY_NAME}/sso?return_to=https%3A%2F%2Fgithub.com%2Fpulls`;
  const ssoId = `${ID_TYPEAHEAD_RESULT_ITEM_PREFIX}-ssoLink`;

  errorCTA.innerHTML = `<em>Please <a href="${ssoLink}" id="${ssoId}">sign in</a> and try again.</em>`;
  return errorCTA;
}

////////////////////////////////////////////////////////////
// DOM HELPERS
////////////////////////////////////////////////////////////

function getVersionTooltip() {
  return document.getElementById(ID_VERSION_TOOLTIP);
}

function getSearchToolbar() {
  return document.getElementById(ID_SEARCH_TOOL_BAR);
}

function getStatus() {
  return document.getElementById(ID_STATUS_DROPDOWN);
}

function getUsernamePredicate() {
  return document.getElementById(ID_USERNAME_PREDICATE_DROPDOWN);
}

function getTypeaheadResultContainer() {
  return document.getElementById(ID_TYPEAHEAD_RESULT_CONTAINER);
}

function getUsernameSearchInput() {
  return document.getElementById(ID_USERNAME_SEARCH_INPUT);
}

function getTextSearchInput() {
  return document.getElementById(ID_TEXT_SEARCH_INPUT);
}

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  for (let [key, value] of Object.entries(options)) {
    element.setAttribute(key, value);
  }
  return element;
}

function hideElement(element) {
  element.style.visibility = "hidden";
}

function showElement(element) {
  element.style.visibility = "visible";
}

function removeChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.lastChild);
  }
}

////////////////////////////////////////////////////////////
// REQUESTS
////////////////////////////////////////////////////////////

async function searchUsers(queryString) {
  return fetch(
    `https://github.com/orgs/${COMPANY_NAME}/people?query=${queryString}`,
    {
      headers: {
        accept: "text/html",
      },
      method: "GET",
    }
  )
    .then((res) => res.text())
    .then((htmlString) =>
      new DOMParser().parseFromString(htmlString, "text/html")
    )
    .then((html) => {
      const requireSso = html.getElementsByClassName("org-sso-panel");
      if (requireSso.length > 0) {
        throw new Error("require-sso");
      }

      const listOfUsers = html.getElementsByClassName("member-list-item");
      return Array.from(listOfUsers).map((li) => {
        const img = li.getElementsByTagName("img")[0];
        const username = img.alt;
        return { username: username.substring(1), img };
      });
    });
}

function executeSearch() {
  const username = getUsernameSearchInput().value;
  const status = getStatus().value;
  const usernamePredicate = getUsernamePredicate().value;
  const text = getTextSearchInput().value;

  const urlQueryParams = [];

  if (status) {
    urlQueryParams.push(`is%3A${status}`);
  }

  if (usernamePredicate && username) {
    urlQueryParams.push(`is%3Apr+${usernamePredicate}%3A${username}`);
  } else if (username) {
    urlQueryParams.push(username);
  }

  if (text) {
    urlQueryParams.push(text);
  }

  let urlQueryParamsString = "";

  if (urlQueryParams.length) {
    urlQueryParamsString += "?q=";
    urlQueryParamsString += urlQueryParams.join("+");
  }

  window.location.replace(`https://github.com/pulls${urlQueryParamsString}`);
}

////////////////////////////////////////////////////////////
// UTIL
////////////////////////////////////////////////////////////

function debounce(fn, time) {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, time);
  };
}

////////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////////

const BORDER_STYLE = "1px solid #30363e;";
const BORDER_RADIUS = "6px;";
const INPUT_HEIGHT = "32px;";
const CTA_COLOR = "#008606";
const GITHUB_BG = "#0c1116";
const GITHUB_BG_MUTED = "#161b23";
const SELECTED_BG = "#30363e";

const css_toggleBase = `
  position: absolute;
  left: -54px;
  height: 32px;
  display: flex;
  align-items: center;
  border-radius: ${BORDER_RADIUS};
  padding: 0px 8px;
`;
const css_toggleOn = `
  ${css_toggleBase}
  color: ${CTA_COLOR};
  background: ${GITHUB_BG};
  border: 1px solid ${CTA_COLOR};
`;
const css_toggleOff = `
  ${css_toggleBase}
  background: ${GITHUB_BG};
  border: ${BORDER_STYLE};
`;

const css_versionTooltip = `
  visibility: hidden;
  transition-delay: 2s;
  position: absolute;
  top: 64px;
  left: -54px;
  background: ${SELECTED_BG};
  padding: 2px;
  font-size: 12px;
  border-radius: ${BORDER_RADIUS};
  width: 62px;
  text-align: center;
`;

const css_searchToolbar = ` 
  position: absolute;
  left: 16px;
  top: 24px;
  background: ${GITHUB_BG};
  z-index: 999;
  width: 980px;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  visibility: visible;
`;

const css_select = `
  height: ${INPUT_HEIGHT};
  background: ${GITHUB_BG};
  border: ${BORDER_STYLE};
  border-radius: ${BORDER_RADIUS};
  padding: 0px 12px;
`;

const css_usernameSearchInput = `
  height: ${INPUT_HEIGHT};
  flex-grow: 1;
  background: ${GITHUB_BG_MUTED};
  padding: 0px 12px;
  border: ${BORDER_STYLE};
  border-radius: ${BORDER_RADIUS};
`;

const css_typeaheadResultContainer = ` 
  position: absolute;
  left: 272px;
  top: 38px;
  align-self: start;
  background: ${GITHUB_BG};
  border: ${BORDER_STYLE};
  border-radius: ${BORDER_RADIUS};
  z-index: 999;
  padding: 8px;
  max-height: 240px;
  overflow: auto;
  visibility: hidden;
`;

const css_typeaheadResultItem = `
  border-radius: ${BORDER_RADIUS};
  padding: 2px 8px 2px 2px;
  cursor: pointer;
  white-space: nowrap;
`;

const css_typeaheadResultAvatar = `
  width: 20px;
  height: 20px;
  margin-right: 6px;
`;

const css_textSearchInput = `
  height: ${INPUT_HEIGHT};
  flex-grow: 1;
  background: ${GITHUB_BG_MUTED};
  padding: 0px 12px;
  border: ${BORDER_STYLE};
  border-radius: ${BORDER_RADIUS};
`;

const css_searchButton = `
  height: 32px;
  background: ${CTA_COLOR};
  border: none;
  border-radius: ${BORDER_RADIUS};
  padding: 0px 8px;
`;

////////////////////////////////////////////////////////////
// EXECUTE
////////////////////////////////////////////////////////////

main();
