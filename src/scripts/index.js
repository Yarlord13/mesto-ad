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

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalTitle = cardInfoModalWindow.querySelector(".popup__title");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalText = cardInfoModalWindow.querySelector(".popup__text");
const cardInfoModalList = cardInfoModalWindow.querySelector(".popup__list");

const deleteModalWindow = document.querySelector(".popup_type_remove-card");
const deleteForm = deleteModalWindow.querySelector(".popup__form");

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
      onDeleteCard: (cardElement, cardId) => openDeleteModal(cardElement, cardId),
      onInfoClick: handleInfoClick,
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
let currentCardIdToDelete = null;
let currentCardElementToDelete = null;

const openDeleteModal = (cardElement, cardId) => {
  currentCardElementToDelete = cardElement;
  currentCardIdToDelete = cardId;
  openModalWindow(deleteModalWindow);
};

const handleDeleteFormSubmit = (evt) => {
  evt.preventDefault();
  if (currentCardIdToDelete && currentCardElementToDelete) {
    deleteCardFromServer(currentCardIdToDelete)
      .then(() => {
        currentCardElementToDelete.remove();
        closeModalWindow(deleteModalWindow);
        currentCardIdToDelete = null;
        currentCardElementToDelete = null;
      })
      .catch((err) => {
        console.log(err);
      });
  }
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
deleteForm.addEventListener("submit", handleDeleteFormSubmit);

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

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const handleInfoClick = (cardId) => {
  getCardList()
    .then((cards) => {
      const cardData = cards.find(card => card._id === cardId);
      if (!cardData) {
        return;
      }

      // Очищаем предыдущие данные
      cardInfoModalTitle.textContent = "Информация о карточке";
      cardInfoModalInfoList.innerHTML = '';
      cardInfoModalList.innerHTML = '';

      // Функция для создания элемента информации
      const createInfoString = (term, description) => {
        const template = document.getElementById('popup-info-definition-template').content;
        const infoElement = template.querySelector('.popup__info-item').cloneNode(true);
        infoElement.querySelector('.popup__info-term').textContent = term;
        infoElement.querySelector('.popup__info-description').textContent = description;
        return infoElement;
      };

      // Добавляем информацию о карточке
      cardInfoModalInfoList.append(
        createInfoString(
          "Описание:",
          cardData.name
        ),
        createInfoString(
          "Дата создания:",
          formatDate(new Date(cardData.createdAt))
        ),
        createInfoString(
          "Владелец:",
          cardData.owner.name
        ),
        createInfoString(
          "Количество лайков:",
          cardData.likes.length
        )
      );

      // Добавляем заголовок для списка лайкнувших
      cardInfoModalText.textContent = "Лайкнули:";

      // Добавляем список лайкнувших
      cardData.likes.forEach(like => {
        const template = document.getElementById('popup-info-user-preview-template').content;
        const userElement = template.querySelector('.popup__list-item').cloneNode(true);

        userElement.innerHTML = `
          <p class="popup__user-name">${like.name}</p>
        `;
        cardInfoModalList.append(userElement);
      });

      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};