export const createCardElement = (
  data,
  { onPreviewPicture, onLikeIcon, onDeleteCard, onInfoButton }, // Добавлен onInfoButton
  userId,
  cardId
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const infoButton = cardElement.querySelector(".card__control-button_type_info"); // Добавлено
  const cardImage = cardElement.querySelector(".card__image");
  const cardTitle = cardElement.querySelector(".card__title");
  const likeCountElement = cardElement.querySelector(".card__like-count");

  // Заполнение данных карточки
  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardTitle.textContent = data.name;
  
  // Установка количества лайков
  if (likeCountElement) {
    likeCountElement.textContent = data.likesCount || 0;
  }
  
  // Установка состояния лайка
  if (data.isLiked) {
    likeButton.classList.add("card__like-button_is-active");
  }
  
  // Скрытие кнопки удаления для чужих карточек
  if (data.owner && data.owner._id !== userId) {
    deleteButton.style.display = "none";
  }
  
  // Назначение обработчиков событий
  if (onLikeIcon) {
    likeButton.addEventListener("click", () => onLikeIcon(likeButton, cardId));
  }
  
  if (onDeleteCard && data.owner && data.owner._id === userId) {
    deleteButton.addEventListener("click", () => onDeleteCard(cardElement, cardId));
  }
  
  if (onPreviewPicture) {
    cardImage.addEventListener("click", () => onPreviewPicture({ name: data.name, link: data.link }));
  }

  // Добавлено: обработчик для кнопки информации
  if (onInfoButton) {
    infoButton.addEventListener("click", () => onInfoButton(cardId));
  }
  
  return cardElement;
};