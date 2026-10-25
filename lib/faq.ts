// Help centre answers. Safe for server and browser. Links are site paths.

export type Faq = { q: string; a: string; link?: { label: string; href: string }; fix?: "pack" };
export type FaqGroup = { id: string; title: string; icon: string; items: Faq[] };

export function faqGroups(fee: string): FaqGroup[] {
  return [
    {
      id: "guests",
      title: "Guests",
      icon: "💸",
      items: [
        { q: "How do I spray?", a: "Scan the QR code on your table. It opens in your phone's browser, with no app to download. Type your name, pick a spray pack, pay by card, bank transfer or USSD, then swipe the notes up. Each one lands on the big screen with your name on it." },
        { q: "I paid but I can't see my notes", a: "Use the checker above. It asks Paystack directly and takes you back to your notes if the payment went through. Bank transfers can take a few minutes to confirm, so if it says \"waiting\", keep the page open.", fix: "pack" },
        { q: "I closed the page, or my phone died", a: "Your notes are safe. Scan the table card again on the same phone and tap \"Continue spraying your last pack\". On a different phone, use the checker above with the reference from your Paystack receipt email (it starts with odg_).", fix: "pack" },
        { q: "My payment failed but money left my account", a: "If Paystack says the payment failed, neither Odogwu nor the celebrant received it. Your bank usually reverses the debit automatically within 24 hours. If it hasn't after 2 working days, send us a message below with the reference and we'll get Paystack to confirm it for your bank." },
        { q: "I bought the wrong pack, or paid twice", a: "Every pack is a gift that goes straight to the celebrant's bank through Paystack, so Odogwu can't reverse it. The good news: you can still spray every note of both packs." },
        { q: "What if I don't spray all my notes?", a: "The money is still the celebrant's. The pack is a gift the moment it's paid; spraying is the fun part." },
        { q: "Can I spray without my name on the screen?", a: "Yes. Tick \"Spray anonymously\" before you pay and the wall shows you as Secret Odogwu 🤫. You can still leave your name for the celebrant's private thank-you list." },
        { q: "What does it cost?", a: `There's a service fee of ${fee} on top of each pack, shown before you pay. The celebrant receives the full pack value.`, link: { label: "How fees work", href: "/#fees" } },
        { q: "Is my card safe?", a: "Payments are handled by Paystack, one of Nigeria's biggest payment companies. Odogwu never sees your card details." },
      ],
    },
    {
      id: "hosts",
      title: "Hosts & celebrants",
      icon: "🎉",
      items: [
        { q: "How do I set up a celebration?", a: "Tap Create a celebration, add the name, the date and the celebrant's bank account. We check the account name with the bank. It takes about two minutes, and it's free. You'll get a dashboard with the QR code, table cards, spray wall and MC script.", link: { label: "Create a celebration", href: "/host/new" } },
        { q: "What do I need on the day?", a: "A laptop connected to a projector or TV, steady internet (Wi-Fi or a phone hotspot), and the table cards printed. Do the rehearsal checklist on your dashboard the day before. We also email it to you." },
        { q: "I lost my host link", a: "Sign in with the email you used when you created the celebration. We'll email you a one-tap sign-in link.", link: { label: "Host sign-in", href: "/host/login" } },
        { q: "The payout account is wrong", a: "Open your dashboard and use \"Change payout account\". New spray packs go to the new account straight away. Packs bought before the change still go to the old one. We email you whenever it changes." },
        { q: "Can I change the celebration name or date?", a: "Yes, from \"Celebration details\" on your dashboard." },
        { q: "When does the money arrive?", a: "Paystack pays it into the celebrant's bank the next working day after each payment. A Saturday party usually lands on Monday; public holidays add a day. Your dashboard shows each payout from Paystack once it's sent." },
        { q: "The money hasn't arrived", a: "Check \"Payouts from Paystack\" on your dashboard first. If it's been more than 2 working days, send us a message below with the celebration name and we'll chase it with Paystack." },
        { q: "The spray wall isn't updating", a: "Refresh the wall page and check the laptop's internet. Use Chrome or Edge, keep the laptop plugged in, and switch off sleep mode. Guests' sprays are always saved, so the wall catches up as soon as it's back online." },
        { q: "Can I stop people spraying?", a: "Yes. Tap \"Close spraying\" on your dashboard when the party ends. You can open it again any time." },
        { q: "Does it cost the host anything?", a: "No. Guests pay the service fee. Premium wall themes are optional." },
      ],
    },
    {
      id: "partners",
      title: "Venues & planners",
      icon: "🤝",
      items: [
        { q: "How do I become a partner?", a: "Sign up on the partners page. You get your dashboard and your link for clients straight away, by email too.", link: { label: "Become a partner", href: "/partners" } },
        { q: "How does my share work?", a: "Every celebration created with your link counts towards your share of the spray pack value. Your dashboard shows each celebration and what you've earned. Shares are paid monthly to the account you give us." },
        { q: "I lost my partner dashboard link", a: "Use Host sign-in with the email you signed up with. Your partner dashboard shows up there.", link: { label: "Sign in", href: "/host/login" } },
        { q: "Can I put the spray wall on our screens?", a: "Yes. Each celebration's wall opens from its host dashboard. Any laptop or smart TV with a browser and internet works." },
      ],
    },
    {
      id: "money",
      title: "Money & trust",
      icon: "🛡️",
      items: [
        { q: "Does Odogwu hold the money?", a: "Never. Every payment goes through Paystack and is paid straight into the celebrant's own bank account. There's no Odogwu wallet or balance." },
        { q: "Can I get a refund?", a: "Spray packs are gifts paid straight to the celebrant, so Odogwu can't refund them. If a payment failed, your bank reverses the debit.", link: { label: "Terms", href: "/terms" } },
        { q: "Who runs Odogwu?", a: "Odogwu is made by The 36th Solutions Ltd, a company registered in Nigeria." },
      ],
    },
  ];
}
