// Middleware di validazione semplice (baseline). In futuro sostituire con Zod/Joi.

const GENDER_ENUM = ['male', 'female', 'prefer_not_to_say'];
const FEED_GENDER_ENUM = ['male', 'female', 'all'];
const VISIBLE_TO_ENUM = ['male', 'female', 'all'];
const THEME_ENUM = ['light', 'dark', 'system'];

export const validateAuthBody = (req, res, next) => {
  const { email, password, nickname } = req.body;

  const isRegister = req.path.includes('register');

  if (isRegister) {
    if (!email || !password || !nickname) {
      return res.status(400).json({ message: 'Campi mancanti' });
    }
  } else {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password richiesti' });
    }
  }

  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ message: 'Formato email non valido' });
  }

  if (password && password.length < 6) {
    return res.status(400).json({ message: 'Password troppo corta (min 6 caratteri)' });
  }

  if (nickname && nickname.length > 40) {
    return res.status(400).json({ message: 'Nickname troppo lungo (max 40)' });
  }

  next();
};

export const validateItemBody = (req, res, next) => {
  let { title, imageUrl, description, size, category, images, condition, isAvailable, visibleTo } = req.body;

  // Se images[] è fornito, non richiediamo imageUrl (lo genereremo dal primo elemento)
  if (!title) {
    return res.status(400).json({ message: 'Titolo è obbligatorio' });
  }
  
  if (!imageUrl && (!images || images.length === 0)) {
    return res.status(400).json({ message: 'imageUrl o images[] sono obbligatori' });
  }

  if (title.length > 120) {
    return res.status(400).json({ message: 'Titolo troppo lungo (max 120)' });
  }

  if (description && description.length > 600) {
    return res.status(400).json({ message: 'Descrizione troppo lunga (max 600)' });
  }

  // Validazione images[]
  if (images) {
    if (!Array.isArray(images)) {
      return res.status(400).json({ message: 'images deve essere un array' });
    }
    for (const imgUrl of images) {
      if (!/^https?:\/\//i.test(imgUrl)) {
        return res.status(400).json({ message: 'Ogni URL in images deve iniziare con http:// o https://' });
      }
    }
  }

  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    return res.status(400).json({ message: 'imageUrl deve iniziare con http:// o https://' });
  }

  // Normalizza stringhe vuote -> undefined (per evitare errori enum)
  if (typeof size === 'string' && size.trim() === '') size = undefined;
  if (typeof category === 'string' && category.trim() === '') category = undefined;
  if (typeof condition === 'string' && condition.trim() === '') condition = undefined;

  const SIZE_ENUM = ["XS", "S", "M", "L", "XL", "XXL"];
  const CATEGORY_ENUM = ["shirt", "pants", "shoes", "jacket", "accessory", "other"];
  const CONDITION_ENUM = ["new", "excellent", "good"];

  if (size && !SIZE_ENUM.includes(size)) {
    return res.status(400).json({ message: `Size non valida. Valori consentiti: ${SIZE_ENUM.join(', ')}` });
  }

  if (category && !CATEGORY_ENUM.includes(category)) {
    return res.status(400).json({ message: `Categoria non valida. Valori consentiti: ${CATEGORY_ENUM.join(', ')}` });
  }

  if (condition && !CONDITION_ENUM.includes(condition)) {
    return res.status(400).json({ message: `Condition non valida. Valori consentiti: ${CONDITION_ENUM.join(', ')}` });
  }

  // Validate visibleTo if provided
  if (visibleTo && !VISIBLE_TO_ENUM.includes(visibleTo)) {
    return res.status(400).json({ message: `visibleTo non valido. Valori consentiti: ${VISIBLE_TO_ENUM.join(', ')}` });
  }

  // Riassegna i valori normalizzati
  req.body.size = size;
  req.body.category = category;
  req.body.condition = condition;

  next();
};

export const validateOnboarding = (req, res, next) => {
  const { age, gender, feedPreference } = req.body;

  // Validate age
  if (age === undefined || age === null) {
    return res.status(400).json({ message: 'Età è obbligatoria' });
  }
  if (typeof age !== 'number' || !Number.isInteger(age)) {
    return res.status(400).json({ message: 'Età deve essere un numero intero' });
  }
  if (age < 16) {
    return res.status(400).json({ message: 'Devi avere almeno 16 anni per usare Swesh' });
  }
  if (age > 120) {
    return res.status(400).json({ message: 'Età non valida (max 120)' });
  }

  // Validate gender
  if (!gender) {
    return res.status(400).json({ message: 'Genere è obbligatorio' });
  }
  if (!GENDER_ENUM.includes(gender)) {
    return res.status(400).json({ message: `Genere non valido. Valori consentiti: ${GENDER_ENUM.join(', ')}` });
  }

  // Validate feedPreference
  if (!feedPreference) {
    return res.status(400).json({ message: 'Preferenza feed è obbligatoria' });
  }
  if (!FEED_GENDER_ENUM.includes(feedPreference)) {
    return res.status(400).json({ message: `Preferenza feed non valida. Valori consentiti: ${FEED_GENDER_ENUM.join(', ')}` });
  }

  next();
};

export const validateFeedPreferences = (req, res, next) => {
  const { showGender, theme } = req.body;

  // At least one field must be provided
  if (!showGender && !theme) {
    return res.status(400).json({ message: 'showGender o theme è obbligatorio' });
  }
  
  if (showGender && !FEED_GENDER_ENUM.includes(showGender)) {
    return res.status(400).json({ message: `showGender non valido. Valori consentiti: ${FEED_GENDER_ENUM.join(', ')}` });
  }

  if (theme && !THEME_ENUM.includes(theme)) {
    return res.status(400).json({ message: `theme non valido. Valori consentiti: ${THEME_ENUM.join(', ')}` });
  }

  next();
};