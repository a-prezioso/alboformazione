# Specifiche Funzionali – Piattaforma Formativa Digitale

## 1. Contesto

L'esigenza nasce dalla volontà di digitalizzare ed evolvere l'erogazione della formazione di una **Associazione Professionale**, superando i limiti della sola partecipazione in diretta e creando un archivio formativo digitale di valore per iscritti e utenti esterni.

La piattaforma dovrà consentire la gestione integrata di eventi formativi live, contenuti in differita, materiali didattici, certificati e crediti formativi, garantendo tracciabilità, automazione e accesso personalizzato in base al profilo dell'utente.

## 2. Obiettivo della piattaforma

L'obiettivo principale è realizzare una piattaforma LMS in grado di erogare formazione sia in modalità **Live** sia in modalità **Differita**, automatizzando:

- l'accesso ai contenuti;
- l'assegnazione delle credenziali;
- il tracciamento della partecipazione;
- il rilascio dei crediti formativi;
- la generazione e il download degli attestati.

La piattaforma dovrà distinguere chiaramente tra contenuti che rilasciano crediti formativi e contenuti extra non certificanti.

## 3. Gestione dei crediti formativi

### 3.1 Assegnazione differenziata

Il sistema dovrà prevedere una gestione differenziata dei crediti formativi in base alla modalità di fruizione:

- partecipazione agli eventi **Live**: assegnazione dei crediti in misura piena;
- fruizione dei contenuti in **Differita**: assegnazione dei crediti in misura ridotta.

A titolo esemplificativo, un evento live potrà riconoscere 2 crediti, mentre la visione in differita potrà riconoscere 1,5 crediti.

### 3.2 Nessuna retroattività

I crediti formativi per la fruizione in differita saranno assegnati esclusivamente ai nuovi webinar e contenuti caricati sulla piattaforma dopo l'avvio del servizio.

Non è prevista l'assegnazione retroattiva di crediti per lo storico dei video già disponibili prima dell'attivazione della piattaforma.

### 3.3 Tracciamento della visione

La piattaforma dovrà garantire il tracciamento effettivo della fruizione dei contenuti video in differita, attraverso standard compatibili con il tracciamento formativo, ad esempio SCORM.

Il sistema dovrà certificare il completamento della visione sulla base di una percentuale minima definita, necessaria per accedere alle verifiche finali e ottenere i crediti.

### 3.4 Test obbligatorio di sblocco

Per ottenere i crediti relativi ai contenuti in differita, l'utente dovrà superare un breve test a risposta multipla.

Il test dovrà essere composto indicativamente da 2-3 domande predisposte dal relatore o dal responsabile del contenuto formativo.

Il test sarà accessibile solo dopo il raggiungimento della percentuale minima di visione prevista.

## 4. Area riservata utente

Ogni utente dovrà disporre di un'area personale accessibile tramite autenticazione.

La piattaforma dovrà gestire profili differenziati, ad esempio:

- utenti associati;
- utenti non associati;
- eventuali profili amministrativi o formatori.

L'area riservata dovrà includere:

- storico dei webinar e dei corsi seguiti;
- stato di avanzamento dei contenuti in differita;
- crediti formativi maturati;
- certificati e attestati finali disponibili per il download;
- materiali didattici integrativi caricati dai relatori;
- eventuali acquisti effettuati tramite la piattaforma.

## 5. Integrazione tecnica e live streaming

### 5.1 Integrazione con piattaforma di videoconferenza

La piattaforma LMS dovrà integrarsi con un account di videoconferenza professionale, ad esempio Zoom Pro, per automatizzare:

- la creazione degli eventi live;
- la gestione degli accessi;
- la tracciatura della partecipazione;
- la raccolta dei log degli incontri;
- l'eventuale recupero delle registrazioni.

### 5.2 Accesso autenticato e Single Sign-On

L'accesso alla piattaforma LMS dovrà avvenire tramite le stesse credenziali del sito istituzionale esistente dell'Associazione Professionale.

Il sistema dovrà verificare automaticamente:

- identità dell'utente;
- stato della membership;
- permessi di accesso;
- condizioni economiche applicabili;
- contenuti disponibili in base al profilo.

## 6. E-commerce formativo

La piattaforma dovrà prevedere una sezione e-commerce dedicata, finalizzata all'acquisto diretto di:

- singoli corsi;
- webinar;
- pacchetti formativi;
- eventuali percorsi tematici.

Il sistema dovrà supportare prezzi differenziati per utenti associati e non associati.

L'acquisto dovrà abilitare automaticamente l'accesso al contenuto o al pacchetto acquistato.

## 7. Gestione dei contenuti extra

La piattaforma dovrà consentire anche la pubblicazione di contenuti non collegati all'erogazione di crediti formativi.

A titolo esemplificativo, potranno essere gestiti:

- interviste;
- registrazioni libere;
- contenuti divulgativi;
- live streaming esterni;
- contenuti provenienti da piattaforme social o strumenti terzi.

Tali contenuti dovranno essere chiaramente distinti dagli eventi formativi ufficiali che rilasciano crediti.

## 8. Requisiti amministrativi

La piattaforma dovrà prevedere un pannello di amministrazione per consentire agli operatori autorizzati di:

- creare e modificare corsi, webinar ed eventi live;
- caricare video, materiali e documenti;
- associare crediti formativi ai singoli contenuti;
- configurare test finali;
- verificare partecipazioni e completamenti;
- gestire utenti, ruoli e permessi;
- esportare report su partecipazioni, crediti e certificazioni;
- pubblicare o archiviare contenuti.

## 9. Output attesi

La soluzione dovrà consentire all'Associazione Professionale di disporre di un ambiente unico per la gestione della formazione digitale, con benefici in termini di:

- automazione dei processi formativi;
- maggiore valorizzazione dei contenuti registrati;
- tracciabilità delle attività degli utenti;
- gestione strutturata dei crediti;
- disponibilità continua di attestati e materiali;
- differenziazione tra contenuti certificanti e contenuti divulgativi.
