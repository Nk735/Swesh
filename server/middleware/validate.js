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
  let { title, imageUrl, description, size, category } = req.body;

  if (!title || !imageUrl) {
    return res.status(400).json({ message: 'Titolo e imageUrl sono obbligatori' });
  }

  if (title.length > 120) {
    return res.status(400).json({ message: 'Titolo troppo lungo (max 120)' });
  }

  if (description && description.length > 600) {
    return res.status(400).json({ message: 'Descrizione troppo lunga (max 600)' });
  }

  if (!/^https?:\/\//i.test(imageUrl)) {
    return res.status(400).json({ message: 'imageUrl deve iniziare con http:// o https://' });
  }

  // Normalizza stringhe vuote -> undefined (per evitare errori enum)
  if (typeof size === 'string' && size.trim() === '') size = undefined;
  if (typeof category === 'string' && category.trim() === '') category = undefined;

  const SIZE_ENUM = ["XS", "S", "M", "L", "XL", "XXL"];
  const CATEGORY_ENUM = ["shirt", "pants", "shoes", "jacket", "accessory", "other"];

  if (size && !SIZE_ENUM.includes(size)) {
    return res.status(400).json({ message: `Size non valida. Valori consentiti: ${SIZE_ENUM.join(', ')}` });
  }

  if (category && !CATEGORY_ENUM.includes(category)) {
    return res.status(400).json({ message: `Categoria non valida. Valori consentiti: ${CATEGORY_ENUM.join(', ')}` });
  }

  // Riassegna i valori normalizzati
  req.body.size = size;
  req.body.category = category;

  next();
};