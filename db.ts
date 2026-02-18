

import Dexie, { type Table } from 'dexie';
import { 
  Profile, Settings, Habit, HabitCheckin, Task, FinanceTransaction, FixedExpense,
  PacerWorkout, Book, ReadingSession, StudySession, WorkTask,
  SessionGoal, GoalCheckin, GoalTemplate, Quote, AppState
} from './types';
import { toError, logDiagnostic } from './utils/error';

export class OnyxDatabase extends Dexie {
  profile!: Table<Profile>;
  settings!: Table<Settings>;
  habits!: Table<Habit>;
  habit_checkins!: Table<HabitCheckin>;
  tasks!: Table<Task>;
  finance_transactions!: Table<FinanceTransaction>;
  fixed_expenses!: Table<FixedExpense>;
  pacer_workouts!: Table<PacerWorkout>;
  books!: Table<Book>;
  reading_sessions!: Table<ReadingSession>;
  study_sessions!: Table<StudySession>;
  work_tasks!: Table<WorkTask>;
  session_goals!: Table<SessionGoal>;
  goal_checkins!: Table<GoalCheckin>;
  goal_templates!: Table<GoalTemplate>;
  quotes!: Table<Quote>;
  app_state!: Table<AppState>;

  constructor() {
    super('OnyxDB');
    
    // Version 8: Added updatedAt to all tables for Sync
    (this as any).version(8).stores({
      profile: '++id, updatedAt',
      settings: '++id, updatedAt',
      habits: '++id, active, updatedAt',
      habit_checkins: '++id, habitId, date, updatedAt',
      tasks: '++id, date, section, done, updatedAt',
      finance_transactions: '++id, date, type, updatedAt',
      fixed_expenses: '++id, updatedAt',
      pacer_workouts: '++id, plannedDate, done, updatedAt',
      books: '++id, status, createdAt, updatedAt',
      reading_sessions: '++id, bookId, date, updatedAt',
      study_sessions: '++id, date, updatedAt',
      work_tasks: '++id, date, done, updatedAt',
      session_goals: '++id, session, active, type, dueDate, updatedAt',
      goal_checkins: '++id, goalId, date, updatedAt',
      goal_templates: '++id, session, isBuiltIn, updatedAt',
      quotes: '++id, updatedAt',
      app_state: 'key, updatedAt'
    }).upgrade(trans => {
      // Initialize updatedAt for existing records
      const now = Date.now();
      return Promise.all(trans.db.tables.map(table => 
        table.toCollection().modify(item => {
          if (!item.updatedAt) item.updatedAt = now;
        })
      ));
    });

    // Add Hooks for Auto-Timestamping
    (this as any).tables.forEach((table: any) => {
      table.hook('creating', (primKey: any, obj: any, trans: any) => {
        obj.updatedAt = Date.now();
      });
      table.hook('updating', (mods: any, primKey: any, obj: any, trans: any) => {
        return { ...mods, updatedAt: Date.now() };
      });
    });
  }
}

export const db = new OnyxDatabase();

export async function ensureInitialData() {
  try {
    if (!(db as any).isOpen()) {
      await (db as any).open();
    }
    
    const profileCount = await db.profile.count();
    if (profileCount === 0) {
      await db.profile.add({ name: 'Leonardo', updatedAt: Date.now() });
    }
    
    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.add({
        meetingMode: false,
        greetingsEnabled: true,
        accent: '#D4AF37',
        updatedAt: Date.now()
      });
    }

    const quotesCount = await db.quotes.count();
    if (quotesCount === 0) {
      const now = Date.now();
      const starterPack = [
        // MODO SHELBY (Ambição, Estoicismo, Frieza)
        { text: "Não confunda minha bondade com fraqueza. Eu sou gentil com todos, mas quando alguém é indelicado comigo, a fraqueza não é o que você vai se lembrar sobre mim.", author: "Thomas Shelby", isCustom: false },
        { text: "Inteligência é uma coisa muito valiosa, meu amigo. E geralmente chega tarde demais.", author: "Thomas Shelby", isCustom: false },
        { text: "Você tem que conseguir o que quer do seu próprio jeito.", author: "Thomas Shelby", isCustom: false },
        { text: "Eu não pago por ternos. Meus ternos são por conta da casa, ou a casa pega fogo.", author: "Thomas Shelby", isCustom: false },
        { text: "O único jeito de garantir o futuro é construí-lo você mesmo.", author: "Shelby Mode", isCustom: false },
        { text: "Não há descanso para mim neste mundo. Talvez no próximo.", author: "Thomas Shelby", isCustom: false },
        { text: "Líderes não reclamam. Líderes encontram soluções em meio ao caos.", author: "Shelby Mode", isCustom: false },
        { text: "Mantenha a boca fechada e os olhos abertos.", author: "Shelby Mode", isCustom: false },
        { text: "A convicção introduz a emoção, que é a inimiga da oratória.", author: "Thomas Shelby", isCustom: false },
        { text: "Para vencer a guerra, você deve se tornar a guerra.", author: "Shelby Mode", isCustom: false },
        { text: "Não entre em pânico quando as coisas ficarem difíceis. É aí que a oportunidade aparece.", author: "Shelby Mode", isCustom: false },
        { text: "O homem que tenta ser tudo para todos acaba sendo nada para ninguém.", author: "Shelby Mode", isCustom: false },
        { text: "Se você quer ser o rei, tem que matar o rei.", author: "Shelby Mode", isCustom: false },
        { text: "Nunca negocie com alguém que não tem nada a perder.", author: "Thomas Shelby", isCustom: false },
        { text: "Um homem que bebe para esquecer, paga a conta duas vezes.", author: "Shelby Mode", isCustom: false },
        { text: "A ambição é a única coisa que mantém um homem vivo.", author: "Shelby Mode", isCustom: false },
        { text: "Respeito não se pede. Respeito se conquista.", author: "Shelby Mode", isCustom: false },
        { text: "Calma. A raiva cega a estratégia.", author: "Shelby Mode", isCustom: false },
        { text: "Quem quer tudo, precisa estar disposto a perder tudo.", author: "Shelby Mode", isCustom: false },
        { text: "Faça planos em silêncio, o sucesso faz barulho por si só.", author: "Shelby Mode", isCustom: false },
        { text: "Não olhe para trás. O passado é uma terra estrangeira.", author: "Shelby Mode", isCustom: false },
        { text: "Controle seus impulsos ou eles controlarão você.", author: "Shelby Mode", isCustom: false },
        { text: "Negócios são negócios. Não leve para o lado pessoal.", author: "Shelby Mode", isCustom: false },
        { text: "A lealdade é um prato caro, não espere de pessoas baratas.", author: "Shelby Mode", isCustom: false },
        { text: "Seja um homem de palavra, ou não diga nada.", author: "Shelby Mode", isCustom: false },
        { text: "O medo é apenas uma reação. A coragem é uma decisão.", author: "Shelby Mode", isCustom: false },
        { text: "Não mostre suas cartas antes da hora.", author: "Shelby Mode", isCustom: false },
        { text: "Sempre vista-se como se fosse encontrar seu pior inimigo.", author: "Shelby Mode", isCustom: false },
        { text: "A paciência é a arma mais perigosa de um homem ambicioso.", author: "Shelby Mode", isCustom: false },
        { text: "Vença a si mesmo e vencerá o mundo.", author: "Shelby Mode", isCustom: false },

        // MODO SPECTER (Confiança, Sucesso, Winning)
        { text: "Eu não tenho sorte. Eu faço minha própria sorte.", author: "Harvey Specter", isCustom: false },
        { text: "A única vez que o sucesso vem antes do trabalho é no dicionário.", author: "Harvey Specter", isCustom: false },
        { text: "Não aumente o tom da sua voz, melhore seus argumentos.", author: "Harvey Specter", isCustom: false },
        { text: "Vencedores não dão desculpas quando o outro lado joga o jogo.", author: "Harvey Specter", isCustom: false },
        { text: "Eu não jogo as probabilidades, eu jogo o homem.", author: "Harvey Specter", isCustom: false },
        { text: "A vida é isso aqui. Eu gosto disso aqui.", author: "Harvey Specter", isCustom: false },
        { text: "Trabalhe até que você não precise mais se apresentar.", author: "Specter Mode", isCustom: false },
        { text: "Se eles acham que você se importa, eles vão andar em cima de você.", author: "Harvey Specter", isCustom: false },
        { text: "Não tenha sonhos, tenha objetivos.", author: "Harvey Specter", isCustom: false },
        { text: "A primeira impressão é a que fica. Certifique-se de que seja lendária.", author: "Specter Mode", isCustom: false },
        { text: "O sucesso é como estar grávida. Todos te parabenizam, mas ninguém sabe quantas vezes você foi f*dido.", author: "Harvey Specter", isCustom: false },
        { text: "Eu recuso a aceitar padrões que não sejam de excelência.", author: "Specter Mode", isCustom: false },
        { text: "Lealdade é uma via de mão dupla. Se eu peço a sua, você tem a minha.", author: "Harvey Specter", isCustom: false },
        { text: "Qualquer um pode fazer o meu trabalho, mas ninguém pode ser eu.", author: "Harvey Specter", isCustom: false },
        { text: "Desculpas não constroem impérios.", author: "Specter Mode", isCustom: false },
        { text: "Foque em ser produtivo, não em estar ocupado.", author: "Specter Mode", isCustom: false },
        { text: "Se você está no inferno, continue andando.", author: "Winston Churchill", isCustom: false },
        { text: "99% das pessoas não estão dispostas a fazer o que é necessário para realizar seus sonhos.", author: "Specter Mode", isCustom: false },
        { text: "O risco é o preço que você paga pela oportunidade.", author: "Specter Mode", isCustom: false },
        { text: "Nunca destrua ninguém em público quando você pode obter o mesmo resultado em privado.", author: "Harvey Specter", isCustom: false },
        { text: "Seja tão bom que eles não possam te ignorar.", author: "Steve Martin", isCustom: false },
        { text: "Confiança é a chave. Se você não acreditar em si mesmo, ninguém acreditará.", author: "Specter Mode", isCustom: false },
        { text: "Pare de reclamar e comece a executar.", author: "Specter Mode", isCustom: false },
        { text: "Não espere por oportunidades extraordinárias. Agarre ocasiões comuns e torne-as grandes.", author: "Specter Mode", isCustom: false },
        { text: "Dinheiro não compra felicidade, mas eu prefiro chorar em uma Ferrari.", author: "Specter Mode", isCustom: false },
        { text: "Seja o CEO da sua própria vida.", author: "Specter Mode", isCustom: false },
        { text: "Não baixe seus padrões. Aumente seu esforço.", author: "Specter Mode", isCustom: false },
        { text: "A vitória ama a preparação.", author: "Specter Mode", isCustom: false },
        { text: "O topo é solitário, mas a vista é espetacular.", author: "Specter Mode", isCustom: false },
        { text: "Você sempre tem uma escolha.", author: "Harvey Specter", isCustom: false },

        // MODO WAYNE (Disciplina, Resiliência, Justiça)
        { text: "Por que caímos? Para aprendermos a nos levantar.", author: "Thomas Wayne", isCustom: false },
        { text: "Não é quem eu sou por dentro, e sim o que eu faço que me define.", author: "Bruce Wayne", isCustom: false },
        { text: "A disciplina é a ponte entre metas e realizações.", author: "Jim Rohn", isCustom: false },
        { text: "A dor é temporária. A glória é eterna.", author: "Wayne Mode", isCustom: false },
        { text: "A noite é mais escura logo antes do amanhecer.", author: "Harvey Dent", isCustom: false },
        { text: "O treinamento não é nada. A vontade é tudo.", author: "Ra's al Ghul", isCustom: false },
        { text: "Você é mais forte do que pensa.", author: "Wayne Mode", isCustom: false },
        { text: "O verdadeiro poder é a capacidade de mudar a si mesmo.", author: "Wayne Mode", isCustom: false },
        { text: "Se você se tornar mais do que apenas um homem, se você se dedicar a um ideal, então você se torna algo totalmente diferente.", author: "Ra's al Ghul", isCustom: false },
        { text: "Suportar, mestre Wayne. Leve isso. Eles vão te odiar por isso, mas esse é o ponto do Batman.", author: "Alfred Pennyworth", isCustom: false },
        { text: "Ninguém vai te bater tão forte quanto a vida.", author: "Rocky Balboa", isCustom: false },
        { text: "A disciplina bate o talento quando o talento não tem disciplina.", author: "Wayne Mode", isCustom: false },
        { text: "Mantenha o foco. O ruído é apenas distração.", author: "Wayne Mode", isCustom: false },
        { text: "Seja a lenda que você nasceu para ser.", author: "Wayne Mode", isCustom: false },
        { text: "Controle sua mente, ou ela controlará você.", author: "Wayne Mode", isCustom: false },
        { text: "Não procure aprovação, procure competência.", author: "Wayne Mode", isCustom: false },
        { text: "O silêncio é a melhor resposta para um tolo.", author: "Wayne Mode", isCustom: false },
        { text: "A melhor vingança é um sucesso massivo.", author: "Frank Sinatra", isCustom: false },
        { text: "Seu corpo pode aguentar quase tudo. É sua mente que você precisa convencer.", author: "Wayne Mode", isCustom: false },
        { text: "Faça o que deve ser feito, não o que é fácil.", author: "Wayne Mode", isCustom: false },
        { text: "A consistência é o que transforma o ordinário em extraordinário.", author: "Wayne Mode", isCustom: false },
        { text: "Não deixe o mundo mudar seu sorriso, use seu sorriso para mudar o mundo.", author: "Wayne Mode", isCustom: false },
        { text: "Heróis são feitos pelo caminho que escolhem, não pelos poderes que possuem.", author: "Iron Man", isCustom: false },
        { text: "O impossível é apenas uma opinião.", author: "Wayne Mode", isCustom: false },
        { text: "Levante-se. De novo. E de novo.", author: "Wayne Mode", isCustom: false },
        { text: "Seus hábitos definem seu futuro.", author: "Wayne Mode", isCustom: false },
        { text: "A força não vem da capacidade física. Vem de uma vontade indomável.", author: "Mahatma Gandhi", isCustom: false },
        { text: "Seja o mestre do seu destino.", author: "Wayne Mode", isCustom: false },
        { text: "A verdadeira vitória é sobre si mesmo.", author: "Wayne Mode", isCustom: false },
        { text: "Aja como se fosse impossível falhar.", author: "Wayne Mode", isCustom: false }
      ].map(q => ({ ...q, updatedAt: now }));
      await db.quotes.bulkAdd(starterPack);
    }

    const templateCount = await db.goal_templates.count();
    if (templateCount === 0) {
      const now = Date.now();
      const rawTemplates: Omit<GoalTemplate, 'id' | 'updatedAt'>[] = [
        // Reading
        { session: 'reading', title: 'Ler 10 páginas/dia', type: 'daily', metricType: 'pages', defaultTargetValue: 10, isBuiltIn: true, defaultDaysOfWeek: [0,1,2,3,4,5,6] },
        { session: 'reading', title: 'Ler 20 páginas/dia', type: 'daily', metricType: 'pages', defaultTargetValue: 20, isBuiltIn: true, defaultDaysOfWeek: [0,1,2,3,4,5,6] },
        { session: 'reading', title: 'Ler 30 min/dia', type: 'daily', metricType: 'minutes', defaultTargetValue: 30, isBuiltIn: true, defaultDaysOfWeek: [0,1,2,3,4,5,6] },
        { session: 'reading', title: 'Registrar leitura todo dia', type: 'daily', metricType: 'boolean', defaultTargetValue: 1, isBuiltIn: true, defaultDaysOfWeek: [0,1,2,3,4,5,6] },
        // Study
        { session: 'study', title: 'Estudar 30 min/dia', type: 'daily', metricType: 'minutes', defaultTargetValue: 30, isBuiltIn: true, defaultDaysOfWeek: [1,2,3,4,5] },
        { session: 'study', title: 'Estudar 60 min/dia', type: 'daily', metricType: 'minutes', defaultTargetValue: 60, isBuiltIn: true, defaultDaysOfWeek: [1,2,3,4,5] },
        { session: 'study', title: 'Estudar 5x/semana', type: 'weekly', metricType: 'count', defaultTargetValue: 5, isBuiltIn: true },
        { session: 'study', title: 'Revisar conteúdo hoje', type: 'one_time', metricType: 'boolean', defaultTargetValue: 1, isBuiltIn: true },
        // Pacer
        { session: 'pacer', title: 'Treinar 3x/semana', type: 'weekly', metricType: 'count', defaultTargetValue: 3, isBuiltIn: true },
        { session: 'pacer', title: 'Correr 20 min/dia', type: 'daily', metricType: 'minutes', defaultTargetValue: 20, isBuiltIn: true, defaultDaysOfWeek: [1,3,5] },
        { session: 'pacer', title: 'Pular corda 10 min/dia', type: 'daily', metricType: 'minutes', defaultTargetValue: 10, isBuiltIn: true, defaultDaysOfWeek: [0,1,2,3,4,5,6] },
        // Work
        { session: 'work', title: 'Concluir 3 tarefas/dia', type: 'daily', metricType: 'count', defaultTargetValue: 3, isBuiltIn: true, defaultDaysOfWeek: [1,2,3,4,5] },
        { session: 'work', title: 'Planejar o dia (check)', type: 'daily', metricType: 'boolean', defaultTargetValue: 1, isBuiltIn: true, defaultDaysOfWeek: [1,2,3,4,5] },
        { session: 'work', title: 'Organizar pendências (15 min)', type: 'daily', metricType: 'minutes', defaultTargetValue: 15, isBuiltIn: true, defaultDaysOfWeek: [1,2,3,4,5] },
        // Finance
        { session: 'finance', title: 'Registrar todos os gastos do dia', type: 'daily', metricType: 'boolean', defaultTargetValue: 1, isBuiltIn: true, defaultDaysOfWeek: [0,1,2,3,4,5,6] },
        { session: 'finance', title: 'Gastar no máximo R$ 50/dia', type: 'daily', metricType: 'currency', defaultTargetValue: 50, isBuiltIn: true, defaultDaysOfWeek: [0,1,2,3,4,5,6] },
        { session: 'finance', title: 'Economizar R$ 300/mês', type: 'monthly', metricType: 'currency', defaultTargetValue: 300, isBuiltIn: true },
        { session: 'finance', title: 'Revisar orçamento semanal', type: 'weekly', metricType: 'boolean', defaultTargetValue: 1, isBuiltIn: true },
      ];
      
      const defaultTemplates: GoalTemplate[] = rawTemplates.map(t => ({ ...t, updatedAt: now }));
      await db.goal_templates.bulkAdd(defaultTemplates);
    }
  } catch (err) {
    const error = logDiagnostic("Database Initialization", err);
    throw toError(error, "Failed to initialize system core.");
  }
}
