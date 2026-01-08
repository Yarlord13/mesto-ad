import { createCardElement, deleteCard, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import {
  getUserInfo,
  getCardList,
  setUserInfo,
  updateAvatar,
  addNewCard,
  deleteCard as deleteCardFromServer,
  changeLikeCardStatus,
} from "./components/api.js";

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

// Инициализация валидации
enableValidation(validationSettings);

// Элементы DOM
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

let currentUserId = "";

// Функция для рендеринга карточек
const renderCard = (cardData, userId) => {
  const isLiked = cardData.likes.some(like => like._id === userId);
  
  const cardElement = createCardElement(
    {
      ...cardData,
      isLiked,
      likesCount: cardData.likes.length,
    },
    {
      onPreviewPicture: handlePreviewPicture,
      onLikeIcon: (likeButton, cardId) => handleLikeCard(likeButton, cardId, cardData),
      onDeleteCard: (cardElement, cardId) => handleDeleteCard(cardElement, cardId),
      onInfoButton: handleInfoClick, // Добавлено
    },
    userId,
    cardData._id
  );
  
  if (cardData.owner._id === userId) {
    const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
    deleteButton.style.display = "block";
  }
  
  return cardElement;
};

// Обработчик превью картинки
const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

// Обработчик лайка карточки
const handleLikeCard = (likeButton, cardId, cardData) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  const likeCountElement = likeButton.closest(".card__likes").querySelector(".card__like-count");
  
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      likeButton.classList.toggle("card__like-button_is-active");
      likeCountElement.textContent = updatedCard.likes.length;
    })
    .catch((err) => {
      console.log(err);
    });
};

// Обработчик удаления карточки
const handleDeleteCard = (cardElement, cardId) => {
  deleteCardFromServer(cardId)
    .then(() => {
      cardElement.remove();
    })
    .catch((err) => {
      console.log(err);
    });
};

// Обработчик отправки формы профиля
const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.target.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  
  submitButton.textContent = "Сохранение...";
  
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

// Обработчик обновления аватара
const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.target.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  
  submitButton.textContent = "Сохранение...";
  
  updateAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      avatarForm.reset();
      closeModalWindow(avatarFormModalWindow);
      clearValidation(avatarForm, validationSettings);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

// Обработчик добавления новой карточки
const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.target.querySelector(".popup__button");
  const originalText = submitButton.textContent;
  
  submitButton.textContent = "Создание...";
  
  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((newCard) => {
      const cardElement = renderCard(newCard, currentUserId);
      placesWrap.prepend(cardElement);
      cardForm.reset();
      closeModalWindow(cardFormModalWindow);
      clearValidation(cardForm, validationSettings);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

// Назначение обработчиков событий
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);

// Открытие формы редактирования профиля
openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

// Открытие формы обновления аватара
profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

// Открытие формы добавления карточки
openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

// Загрузка начальных данных
Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUserId = userData._id;
    
    // Установка данных пользователя
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
    
    // Отрисовка карточек
    cards.forEach((card) => {
      const cardElement = renderCard(card, currentUserId);
      placesWrap.append(cardElement);
    });
  })
  .catch((err) => {
    console.log(err);
  });

// Инициализация модальных окон
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// Элементы DOM для модального окна статистики
const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoUsersList = cardInfoModalWindow.querySelector(".popup__list");

// Функция для форматирования даты
const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Создание элемента информации для модального окна
const createInfoString = (term, description) => {
  const template = document.querySelector("#popup-info-definition-template");
  const infoItem = template.content.cloneNode(true);
  
  const termElement = infoItem.querySelector(".popup__info-term");
  const descriptionElement = infoItem.querySelector(".popup__info-description");
  
  termElement.textContent = term;
  descriptionElement.textContent = description;
  
  return infoItem;
};

// Создание элемента пользователя для списка лайкнувших
const createUserPreview = (user) => {
  const template = document.querySelector("#popup-info-user-preview-template");
  const userItem = template.content.cloneNode(true);
  
  const userBadge = userItem.querySelector(".popup__list-item_type_badge");
  userBadge.textContent = user.name;
  
  return userItem;
};

// Обработчик клика по кнопке информации
const handleInfoClick = (cardId) => {
  // Очищаем предыдущие данные
  cardInfoList.innerHTML = "";
  cardInfoUsersList.innerHTML = "";
  
  // Получаем актуальные данные с сервера
  getCardList()
    .then((cards) => {
      const cardData = cards.find(card => card._id === cardId);
      
      if (!cardData) {
        console.error("Карточка не найдена");
        return;
      }
      
      // Устанавливаем заголовок
      cardInfoTitle.textContent = cardData.name;
      
      // Добавляем информацию о карточке
      cardInfoList.append(
        createInfoString(
          "Дата создания:",
          formatDate(new Date(cardData.createdAt))
        )
      );
      
      cardInfoList.append(
        createInfoString(
          "Количество лайков:",
          cardData.likes.length.toString()
        )
      );
      
      cardInfoList.append(
        createInfoString(
          "Автор:",
          cardData.owner.name || "Неизвестно"
        )
      );
      
      // Добавляем заголовок для списка пользователей
      if (cardData.likes.length > 0) {
        cardInfoText.textContent = "Пользователи, лайкнувшие карточку:";
        
        // Добавляем пользователей в список
        cardData.likes.forEach(user => {
          cardInfoUsersList.append(createUserPreview(user));
        });
      } else {
        cardInfoText.textContent = "Эту карточку еще никто не лайкнул";
      }
      
      // Открываем модальное окно
      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};