// Middleware di validazione semplice (baseline). In futuro sostituire con Zod/Joi.

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
  let { title, imageUrl, description, size, category, images, condition, isAvailable } = req.body;

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

  // Riassegna i valori normalizzati
  req.body.size = size;
  req.body.category = category;
  req.body.condition = condition;

  next();
};