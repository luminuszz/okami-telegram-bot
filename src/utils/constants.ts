export const classes = [
  {
    day: 'SEGUNDA',
    dayNumber: 1,
    subject: 'SISTEMAS DISTRIBUÍDOS',
    room: 'b401',
    teacher: 'Marla Miranda',
    extra: 'LAMI 13',
  },
  {
    day: 'TERÇA',
    dayNumber: 2,
    subject: 'GOVERNANÇA DE TECNOLOGIA DA INFORMAÇÃO',
    room: 'b412',
    teacher: 'Fernando Cezar',
  },
  {
    day: 'QUARTA',
    dayNumber: 3,
    subject: 'ESTRUTURA DISCRETA E LÓGICA',
    room: 'b412',
    teacher: 'João Luciano',
  },
  {
    day: 'QUINTA',
    dayNumber: 4,
    subject: 'ARQUITETURA DE SOFTWARE',
    room: 'b417',
    teacher: 'Fernando Cezar',
  },
] as const;

export type ClassRoom = (typeof classes)[number];
