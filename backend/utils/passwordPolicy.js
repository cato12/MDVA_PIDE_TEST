import passwordValidator from 'password-validator';

const schema = new passwordValidator();

schema
  .is().min(8)                                    // Mínimo 8 caracteres
  .is().max(100)                                  // Máximo 100 caracteres
  .has().uppercase()                              // Al menos una mayúscula
  .has().lowercase()                              // Al menos una minúscula
  .has().digits()                                 // Al menos un número
  .has().not().spaces();                          // Sin espacios

export default schema;
