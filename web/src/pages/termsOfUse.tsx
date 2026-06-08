import { PageTitle } from "components/base/pageTitle";
import { useTranslation } from "react-i18next";

// The body of the Terms is a legal document so it can't be translated
// and is presented in English only.
export const TermsOfUse = function () {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center">
      <PageTitle value={t("pages.terms-of-use.title")} />
      <div className="text-b-regular flex w-full items-center justify-center gap-x-3 border-y border-gray-200 bg-gray-100 py-4 text-gray-500">
        <p>{t("pages.terms-of-use.published-by")}</p>
        <span aria-hidden="true">·</span>
        <p>{t("pages.terms-of-use.last-updated")}</p>
      </div>
      <div className="text-b-regular flex flex-col gap-y-4 bg-white p-4 text-gray-500 md:px-20 md:py-12 lg:px-30">
        <p>
          These Terms of Use (together with any appendices, schedules, and
          documents incorporated by reference, the{" "}
          <strong>“Terms,” “Terms of Use,”</strong> or this{" "}
          <strong>“Agreement”</strong>) govern your access to and use of the
          website located at <strong>https://vetro.org</strong> (the{" "}
          <strong>“Site”</strong>), the web-hosted interface located at{" "}
          <strong>https://app.vetro.org</strong> (the{" "}
          <strong>“Interface”</strong>), and any other websites, applications,
          dashboards, or tools made available by Vetro Service & Support Ltd., a
          company incorporated under the laws of the British Virgin Islands (the{" "}
          <strong>“Foundation,” “Vetro,” “we,” “our,”</strong> or{" "}
          <strong>“us”</strong>). The Site and the Interface collectively
          facilitate access to, and interaction with, a set of open-source,
          self-executing smart contracts deployed on one or more public
          blockchains (the “Protocol”) that programmatically issue digital
          tokens designed to reference the value of one or more underlying
          assets upon deposit of eligible cryptoassets by a user (each such
          issued token, a <strong>“Protocol Generated Asset”</strong> or{" "}
          <strong>“PGA”</strong>).
        </p>
        <h4>IMPORTANT NOTICES — PLEASE READ CAREFULLY</h4>
        <p className="text-b-medium">
          RESTRICTED PERSONS. THE SERVICES ARE NOT OFFERED TO, AND MAY NOT BE
          ACCESSED OR USED BY, ANY PERSON OR ENTITY WHO RESIDES IN, IS A CITIZEN
          OF, IS LOCATED IN, IS INCORPORATED OR ORGANIZED UNDER THE LAWS OF, OR
          HAS A REGISTERED OFFICE IN ANY RESTRICTED TERRITORY (AS DEFINED IN
          SECTION 2.2), OR WHO IS OTHERWISE A RESTRICTED PERSON. USE OF A
          VIRTUAL PRIVATE NETWORK, PROXY SERVER, OR ANY OTHER MEANS OF
          CIRCUMVENTING SUCH RESTRICTIONS IS STRICTLY PROHIBITED AND CONSTITUTES
          A MATERIAL BREACH OF THESE TERMS.
        </p>
        <p className="text-b-medium">
          BINDING ARBITRATION; CLASS ACTION AND JURY TRIAL WAIVER. SECTION 15 OF
          THESE TERMS CONTAINS AN AGREEMENT TO RESOLVE ALL DISPUTES THROUGH
          BINDING, INDIVIDUAL ARBITRATION RATHER THAN IN COURT, AND INCLUDES A
          WAIVER OF THE RIGHT TO A JURY TRIAL AND THE RIGHT TO PARTICIPATE IN A
          CLASS OR REPRESENTATIVE ACTION. PLEASE REVIEW SECTION 15 CAREFULLY.
        </p>
        <p className="text-b-medium">
          TECHNOLOGY PROVIDER ONLY; NO FIDUCIARY RELATIONSHIP. THE FOUNDATION
          PROVIDES TECHNOLOGY SERVICES THAT MAKE IT POSSIBLE FOR USERS TO
          INTERACT WITH OPEN-SOURCE SMART CONTRACTS THAT OPERATE
          DETERMINISTICALLY AND AUTONOMOUSLY. THE FOUNDATION IS NOT A BROKER,
          DEALER, EXCHANGE, INVESTMENT ADVISER, CUSTODIAN, MONEY SERVICE
          BUSINESS, OR FINANCIAL INSTITUTION OF ANY KIND AND DOES NOT HOLD OR
          EXERCISE CUSTODY, POSSESSION, OR CONTROL OVER ANY USER CRYPTOASSETS AT
          ANY TIME. THE PROTOCOL GENERATED ASSETS ARE PROGRAMMATIC CLAIMS
          AGAINST SMART-CONTRACT RESERVES AND ARE NOT DEPOSITS, SECURITIES,
          INVESTMENT CONTRACTS, PAYMENT STABLECOINS, ELECTRONIC MONEY,
          ASSET-REFERENCED TOKENS WITHIN THE MEANING OF ANY APPLICABLE
          REGULATION, OR PAYMENT INSTRUMENTS ISSUED BY OR GUARANTEED BY ANY
          GOVERNMENT, CENTRAL BANK, OR FINANCIAL INSTITUTION.
        </p>
        <h3>1. DEFINITIONS</h3>
        <p>
          For the purposes of these Terms, the following capitalized terms shall
          have the meanings set out below. Other capitalized terms are defined
          where they first appear.
        </p>
        <p>
          <strong>“Applicable Law”</strong> means any statute, regulation, rule,
          ordinance, order, decree, directive, treaty, binding judicial or
          administrative decision, or other legal requirement of any
          governmental or regulatory authority of competent jurisdiction, as the
          same may be amended from time to time.
        </p>
        <p>
          <strong>“Approved Collateral Assets”</strong> means those
          cryptoassets, as designated from time to time within the Interface or
          the Documentation, which may be deposited into the Protocol in
          exchange for the programmatic issuance of Protocol Generated Assets.
        </p>
        <p>
          <strong>“Documentation”</strong> means the technical, operational, and
          descriptive materials concerning the Protocol, the Interface, or the
          Protocol Generated Assets published by the Foundation from time to
          time, including at https://docs.vetro.org.
        </p>
        <p>
          <strong>“Foundation Parties”</strong> means the Foundation together
          with its affiliates, successors, assigns, and each of their respective
          officers, directors, employees, contractors, consultants, agents,
          service providers, and representatives.
        </p>
        <p>
          <strong>“Governance Token”</strong> means any digital token that the
          Foundation or the Protocol may, in the future, make available to
          enable decentralized governance of the Protocol. No Governance Token
          is currently issued, and any future issuance shall be subject to
          separate terms and conditions.
        </p>
        <p>
          <strong>“Prohibited Jurisdiction”</strong> has the meaning set out in
          Section 2.2.
        </p>
        <p>
          <strong>“Protocol”</strong> means the open-source, self-executing,
          autonomous smart-contract system and associated on-chain components
          that programmatically issue and manage Protocol Generated Assets, as
          deployed from time to time on the Ethereum blockchain and on such
          other public blockchains as the Foundation may determine.
        </p>
        <p>
          <strong>“Protocol Generated Asset”</strong> or <strong>“PGA”</strong>
          means a digital token programmatically issued by the Protocol’s smart
          contracts and designed to reference the value of one or more
          underlying assets, subject to the mechanics, limitations, and risks
          described in the Documentation. A Protocol Generated Asset is a
          technical claim against the Reserves in accordance with the rules
          encoded in the relevant smart contracts. Protocol Generated Assets are
          not issued or guaranteed by the Foundation or any governmental
          authority and do not constitute a representation, warranty, or
          undertaking by the Foundation that any particular value relationship
          will be achieved or maintained.
        </p>
        <p>
          <strong>“Reference Asset”</strong> means, in respect of a particular
          series of Protocol Generated Assets, the asset or basket of assets to
          whose value such Protocol Generated Assets are designed to refer, as
          identified in the Documentation. A Reference Asset is used solely as a
          value reference for the operation of the Protocol’s smart contracts
          and does not constitute a redemption claim against the Foundation.
        </p>
        <p>
          <strong>“Reserves”</strong> means the cryptoassets held from time to
          time in the smart-contract vaults of the Protocol as collateral
          supporting the operation of outstanding Protocol Generated Assets. The
          Reserves are held programmatically by the Protocol and are not in the
          possession, custody, or control of the Foundation.
        </p>
        <p>
          <strong>“Restricted Person”</strong> means any Person who (i) resides
          in, is a citizen of, is located in, is incorporated in, or has a
          registered office in any Prohibited Jurisdiction; (ii) is named on, or
          is owned or controlled by any Person named on, any sanctions list
          maintained by the Office of Foreign Assets Control of the U.S.
          Department of the Treasury (“OFAC”), His Majesty’s Treasury of the
          United Kingdom, the European Union, the United Nations Security
          Council, or any other competent authority; or (iii) is otherwise
          prohibited from using the Services under Applicable Law.
        </p>
        <p>
          <strong>“User,” “you,”</strong> or <strong>“your”</strong> means any
          Person who accesses or uses any of the Services.
        </p>
        <h3>2. ELIGIBILITY AND RESTRICTED PERSONS</h3>
        <h4>2.1 General Eligibility</h4>
        <p>
          To access or use the Services, you must (a) be at least eighteen (18)
          years of age, or the age of majority in your jurisdiction of residence
          if higher; (b) have full legal capacity and authority to enter into
          and perform your obligations under these Terms; (c) not be a
          Restricted Person; and (d) not be otherwise prohibited from accessing
          or using the Services under Applicable Law. If you access or use the
          Services on behalf of an entity, you represent and warrant that you
          have the legal authority to bind such entity to these Terms.
        </p>
        <h4>2.2 Prohibited Jurisdictions</h4>
        <p>
          For the purposes of these Terms,
          <strong>“Prohibited Jurisdiction”</strong> means (i) the United States
          of America (including its territories and possessions); (ii) the
          Republic of Cuba; (iii) the Islamic Republic of Iran; (iv) the
          Democratic People's Republic of Korea (North Korea); (v) the Syrian
          Arab Republic; (vi) the Russian Federation; (vii) the Crimea, Donetsk
          People's Republic, and Luhansk People's Republic regions of Ukraine;
          and (viii) any other country, territory, or region that is the subject
          of comprehensive economic sanctions or embargoes administered or
          enforced by the United States, the European Union, the United Kingdom,
          the United Nations Security Council, or the British Virgin Islands.
          The Foundation reserves the right, in its sole discretion, to
          designate additional jurisdictions as Prohibited Jurisdictions at any
          time and without notice.
        </p>
        <h4>2.3 No Circumvention</h4>
        <p>
          You represent and warrant that you will not use a virtual private
          network (“VPN”), proxy service, anonymizer, relay, or any other
          technical or non-technical means to (a) conceal your true location or
          identity, (b) circumvent any geographic, technical, or regulatory
          restriction imposed on the Services, or (c) otherwise evade the
          restrictions set forth in these Terms. Any attempt to do so
          constitutes a material breach of these Terms and may result in
          immediate termination of your access to the Services, without notice
          or liability, and referral to competent authorities where appropriate.
        </p>
        <h4>2.4 Representations and Warranties of the User</h4>
        <p>
          By accessing or using the Services, you represent and warrant on a
          continuing basis that: (a) you are not a Restricted Person; (b) you
          have not been placed on any sanctions list or list of denied or
          blocked persons maintained by any competent authority; (c) the funds
          and cryptoassets you use in connection with the Services have been
          lawfully obtained and are beneficially owned by you (or, where you act
          for an entity, by that entity); (d) your access to and use of the
          Services does not violate any Applicable Law binding upon you; (e) you
          will not use the Services to transact with any Restricted Person; and
          (f) all information you provide in connection with the Services is,
          and will remain, true, accurate, current, and complete.
        </p>
        <h3>3. DESCRIPTION OF THE SERVICES</h3>
        <h4>3.1 Scope of the Services</h4>
        <p>
          The Services comprise the Site, the Interface, the Documentation, and
          any related software tools, APIs, dashboards, and informational
          resources that the Foundation makes available from time to time. The
          Services provide one, but not the exclusive, means of interacting with
          the Protocol. The Protocol itself consists of open-source,
          self-executing smart contracts that operate autonomously on public
          blockchains and is not, for the avoidance of doubt, operated,
          controlled, or maintained by the Foundation.
        </p>
        <h4>3.2 Programmatic Issuance of Protocol Generated Assets</h4>
        <p>
          The Protocol permits Users to deposit Approved Collateral Assets into
          Protocol smart contracts in exchange for the programmatic issuance of
          Protocol Generated Assets, subject to applicable collateralization
          ratios, parameters, and other rules encoded in the smart contracts.
          Upon such deposit, the Approved Collateral Assets form part of the
          Reserves and are held programmatically by the Protocol. The Foundation
          does not hold, control, or have possession of the Reserves or any User
          cryptoassets at any time. A Protocol Generated Asset represents a
          programmatic claim against the Protocol's smart contracts in
          accordance with the rules encoded therein and is not a deposit,
          security, investment contract, payment stablecoin, electronic money,
          asset-referenced token within the meaning of any applicable
          regulation, money, currency, or payment instrument issued or
          guaranteed by any sovereign authority or financial institution.
        </p>
        <h4>3.3 Reference-Value Mechanics</h4>
        <p>
          The Protocol Generated Assets are crypto-collateralized digital tokens
          whose operation is designed to reference the value of one or more
          underlying assets identified in the Documentation. Such reference is
          implemented through the autonomous operation of smart-contract logic,
          including collateralization requirements, oracle-driven valuation, and
          liquidation mechanisms. The Foundation makes no representation,
          warranty, or undertaking that any Protocol Generated Asset will at any
          time achieve, approximate, or maintain its intended reference value,
          nor that the Protocol's reference mechanisms will function as
          designed. Users acknowledge that the market value of a Protocol
          Generated Asset may at any time and for any duration deviate
          materially from its intended reference value, including as a result of
          market volatility, oracle failure, smart-contract vulnerability,
          collateral insufficiency, liquidity disruptions, governance actions,
          regulatory developments, or other factors, and that such deviations
          may be significant, sustained, and unrecoverable.
        </p>
        <h4>3.4 Technology Provider Positioning</h4>
        <p>
          The Foundation positions itself solely as a technology provider. The
          Services constitute technical and administrative facilities that
          enable Users to interact with the Protocol. The Foundation does not:
          (a) offer, solicit, or recommend the purchase, sale, or exchange of
          any cryptoasset or financial instrument; (b) provide investment,
          legal, accounting, tax, or financial advice; (c) act as a counterparty
          to any transaction executed on the Protocol; (d) act as an
          intermediary, agent, or fiduciary for any User; (e) issue, redeem, or
          guarantee any Protocol Generated Asset; or (f) guarantee the
          execution, settlement, or outcome of any transaction. Nothing in the
          Services constitutes a public offer of securities, a prospectus, a
          solicitation in respect of any payment stablecoin or asset-referenced
          token, or an invitation to invest in any jurisdiction.
        </p>
        <h4>3.5 Modification of the Services and Protocol Upgrades</h4>
        <p>
          The Foundation reserves the right, in its sole discretion and without
          liability, to add to, modify, suspend, or discontinue all or any part
          of the Services at any time, with or without notice. Prior to the
          issuance of any Governance Token, the Foundation may propose, deploy,
          or coordinate upgrades, parameter changes, or emergency measures with
          respect to the Protocol, including pausing smart-contract
          functionality where necessary to protect Users or the integrity of the
          Protocol. Following the issuance of any Governance Token, material
          changes to the Protocol are expected to be subject to decentralized
          governance in accordance with the then-prevailing governance rules,
          and the Foundation's role will correspondingly be reduced. You
          acknowledge and agree that any such upgrades, changes, or governance
          actions may materially affect the functionality, availability,
          reference-value behavior, or market value of the Protocol Generated
          Assets and your ability to access them.
        </p>
        <h4>3.6 Third-Party Services</h4>
        <p>
          The Services may include links to, or integrations with, third-party
          websites, applications, oracles, wallet providers, bridges, relayers,
          liquidity venues, or other services (collectively, “Third-Party
          Services”). The Foundation does not control, endorse, or assume any
          responsibility for Third-Party Services. Your use of any Third-Party
          Service is governed by the terms and privacy policies of the
          applicable third party, and is undertaken at your sole risk. The
          Foundation shall not be liable for any loss or damage arising out of
          or in connection with your use of, or reliance on, any Third-Party
          Service.
        </p>
        <h4>3.7 Informational Resources</h4>
        <p>
          The Documentation, blog posts, whitepapers, tutorials, social-media
          communications, and other informational materials made available by
          the Foundation are provided for informational purposes only. They do
          not constitute advice of any kind and are not exhaustive. The
          Foundation makes no representation or warranty as to the accuracy,
          completeness, or timeliness of such materials and assumes no
          obligation to update them.
        </p>
        <h3>4. CUSTODY AND SECURITY</h3>
        <h4>4.1 Non-Custodial Nature of the Services</h4>
        <p>
          The Services are non-custodial. The Foundation does not, at any time,
          take possession, custody, or control of any cryptoassets, private
          keys, seed phrases, wallet credentials, or other authentication
          materials belonging to any User. All transactions effected through the
          Protocol are executed directly between the User's self-custodied
          digital wallet and the Protocol's smart contracts. The Foundation has
          no ability to initiate, authorize, reverse, cancel, or modify any such
          transaction, nor to recover, freeze, or restore any cryptoassets lost,
          stolen, or otherwise misdirected by a User.
        </p>
        <h4>4.2 User Responsibility for Keys and Wallets</h4>
        <p>
          You are solely responsible for: (a) the security, integrity, and
          confidentiality of your private keys, seed phrases, wallet
          credentials, and any device used to access the Services; (b) all
          transactions that originate from your digital wallet, whether or not
          authorized by you; (c) selecting and using a digital wallet provider
          compatible with the Interface and acceptable to you; (d) ensuring that
          any wallet address you use in connection with the Services is
          accurate; and (e) all losses arising out of user error, forgotten or
          lost credentials, compromised wallets, or incorrectly constructed or
          directed transactions. The Foundation shall have no liability
          whatsoever in respect of any of the foregoing.
        </p>
        <h4>4.3 No Recovery</h4>
        <p>
          You acknowledge that transactions on public blockchains are, by their
          nature, generally irreversible once confirmed. The Foundation has no
          ability to reverse, cancel, or recover any transaction or cryptoasset
          once submitted to the Protocol or any underlying blockchain network,
          regardless of whether such transaction was submitted erroneously,
          fraudulently, or without authorization.
        </p>
        <h3>5. COMPLIANCE WITH LAWS</h3>
        <h4>5.1 User Compliance</h4>
        <p>
          You are solely responsible for determining whether, and to what
          extent, your access to and use of the Services is lawful in your
          jurisdiction and under any Applicable Law binding upon you. You agree
          to comply with all Applicable Laws in connection with your use of the
          Services, including, without limitation, laws and regulations relating
          to anti-money laundering, countering the financing of terrorism,
          sanctions, export controls, consumer protection, securities,
          commodities, financial services, data protection, and taxation.
          Nothing in these Terms or in the Services constitutes legal, tax,
          accounting, or investment advice, and you should consult independent
          professional advisers as appropriate.
        </p>
        <h4>5.2 Anti-Money Laundering, Sanctions, and Screening</h4>
        <p>
          The Foundation may, in its sole discretion and without prior notice,
          implement or modify controls designed to detect, prevent, or mitigate
          unlawful activity, including by restricting access to the Services
          from particular IP addresses, device identifiers, or wallet addresses;
          by engaging blockchain-analytics providers to screen transactions and
          wallet addresses; and by suspending or terminating access in response
          to any suspected breach of Applicable Law or of these Terms. The
          Foundation may share information relating to such activity with
          competent authorities, service providers, and counterparties as it
          considers appropriate or as required by Applicable Law.
        </p>
        <h4>5.3 Regulatory Change</h4>
        <p>
          You acknowledge that the regulatory treatment of cryptoassets,
          reference-value tokens, and decentralized protocols remains uncertain
          and is evolving across jurisdictions. Regulatory developments may
          materially affect the availability, functionality, or legal
          classification of the Services, the Protocol, or the Protocol
          Generated Assets, including the potential characterization of Protocol
          Generated Assets as securities, payment stablecoins, asset-referenced
          tokens, electronic money, or other regulated instruments under any
          present or future law. You waive any claim against the Foundation
          Parties arising out of or in connection with any change in Applicable
          Law or any regulatory action, inquiry, or determination affecting the
          Services, the Protocol, or the Protocol Generated Assets.
        </p>
        <h4>5.4 Tax</h4>
        <p>
          You are solely responsible for determining the tax consequences of
          your use of the Services and for reporting and remitting any taxes
          that may arise in connection with your activities, including, without
          limitation, income, capital gains, value-added, goods-and-services,
          and withholding taxes. The Foundation does not provide tax advice and
          does not undertake to collect, withhold, or remit any taxes on your
          behalf.
        </p>
        <h3>6. RISK DISCLOSURE</h3>
        <p>
          Your use of the Services involves substantial risk, including the risk
          of total loss of value of any cryptoassets you transfer to, hold
          through, or receive from the Protocol. By using the Services, you
          expressly acknowledge and accept each of the risks set out below, and
          you agree that the Foundation Parties shall have no liability in
          respect of any such risk or the consequences thereof.
        </p>
        <h4>6.1 Market and Volatility Risk</h4>
        <p>
          The market value of cryptoassets, including the Approved Collateral
          Assets and any Protocol Generated Assets, may fluctuate significantly,
          rapidly, and unpredictably. Protocol Generated Assets may fail to
          maintain any particular value relationship with their Reference Asset
          during periods of extreme volatility, illiquidity, or market
          dislocation, and their market value may fall materially below the
          value of the Reference Asset, including to zero.
        </p>
        <h4>6.2 Smart-Contract and Technology Risk</h4>
        <p>
          The Protocol comprises smart contracts and software that may contain
          bugs, vulnerabilities, logic errors, or other defects, whether or not
          discovered or disclosed. Such defects may result in the partial or
          total loss of cryptoassets deposited in the Protocol, the erroneous
          issuance or treatment of Protocol Generated Assets, the failure of
          liquidation or reference mechanisms, or other adverse consequences.
          Audits, formal verification, or security reviews do not guarantee that
          the Protocol is free from defects.
        </p>
        <h4>6.3 Oracle and External-Data Risk</h4>
        <p>
          The Protocol relies upon price oracles and other external data sources
          to determine collateralization ratios, liquidation thresholds,
          reference valuations, and other operational parameters. Oracle
          failure, manipulation, latency, or inaccuracy may cause the Protocol
          to function incorrectly and may result in loss, including through
          improper liquidations or mispricing of Protocol Generated Assets.
        </p>
        <h4>6.4 Collateral and Liquidation Risk</h4>
        <p>
          The Approved Collateral Assets are themselves volatile and subject to
          loss of value. In the event that the value of a User's collateral
          falls below the applicable liquidation threshold, the Protocol may
          programmatically liquidate such collateral without notice and on terms
          that may be unfavorable to the User. Users may lose all or
          substantially all of their collateral as a result of such liquidation.
        </p>
        <h4>6.5 Reference-Value Risk</h4>
        <p>
          Protocol Generated Assets are designed to reference the value of an
          underlying asset; they are not, and should not be relied upon as,
          instruments that guarantee any particular value or that are redeemable
          on demand at a fixed rate. There is no guarantee that a Protocol
          Generated Asset will at any time trade at, near, or in any particular
          relationship to the value of its Reference Asset, nor that any holder
          will be able to exchange a Protocol Generated Asset for Approved
          Collateral Assets or for any other asset at any given time, in any
          given quantity, or at any given price. The Foundation makes no
          commitment to stabilize, support, intervene in, or otherwise influence
          the market value of any Protocol Generated Asset.
        </p>
        <h4>6.6 Blockchain Network Risk</h4>
        <p>
          The Protocol operates on public blockchain networks that are beyond
          the Foundation's control. Such networks may experience congestion,
          forks, consensus failures, reorganizations, denial-of-service
          conditions, validator or miner misbehavior, or other events that may
          delay, prevent, or adversely affect transactions. Gas fees may rise
          substantially or unpredictably and transactions may fail, time out, or
          be replaced.
        </p>
        <h4>6.7 Cybersecurity Risk</h4>
        <p>
          Cryptoassets and the systems used to hold, transfer, and transact in
          them are subject to cybersecurity threats, including phishing, social
          engineering, private-key theft, wallet compromise, front-end spoofing,
          supply-chain attacks, and exploits of third-party dependencies. The
          Foundation cannot guarantee that the Services, or any component
          thereof, will be free from such threats.
        </p>
        <h4>6.8 Regulatory and Legal Risk</h4>
        <p>
          Legal and regulatory frameworks applicable to cryptoassets,
          reference-value tokens, and decentralized protocols are evolving.
          Future legislation, rule-making, enforcement actions, or judicial
          decisions may adversely affect the Services, the Protocol, the
          Protocol Generated Assets, or your ability to use or transfer them.
          Possible regulatory outcomes include reclassification of Protocol
          Generated Assets as securities, payment stablecoins, asset-referenced
          tokens, electronic money, or other regulated instruments, the
          imposition of licensing requirements, or restrictions on cross-border
          transfer or use.
        </p>
        <h4>6.9 Irreversibility of Transactions</h4>
        <p>
          Transactions executed on public blockchains are generally
          irreversible. A transaction that is erroneous, fraudulent, or
          initiated by an unauthorized party cannot be reversed or undone by the
          Foundation.
        </p>
        <h4>6.10 No Deposit Insurance or Compensation Scheme</h4>
        <p>
          The Protocol Generated Assets and any cryptoassets you transfer to or
          hold through the Protocol are not protected by any governmental
          deposit insurance scheme, investor compensation fund, or similar
          arrangement. In the event of loss, you will have no recourse to any
          such scheme.
        </p>
        <h3>7. PROHIBITED ACTIVITIES</h3>
        <p>
          You shall not, directly or indirectly, and shall not permit,
          encourage, or enable any third party to, in connection with the
          Services:
        </p>
        <h4>7.1 Unlawful and Harmful Activity</h4>
        <p>
          (a) use the Services for any purpose that is unlawful under Applicable
          Law, or that would assist, facilitate, or constitute a violation of
          any Applicable Law, including anti-money laundering,
          counter-terrorism-financing, sanctions, export-control, or securities
          laws; (b) use the Services to launder the proceeds of unlawful
          activity or to finance any unlawful activity; (c) use the Services to
          transact with any Restricted Person or counterparty located in any
          Prohibited Jurisdiction; or (d) engage in any fraudulent, deceptive,
          manipulative, or abusive conduct in connection with the Services or
          the Protocol.
        </p>
        <h4>7.2 Market Integrity</h4>
        <p>
          (a) engage in any form of market manipulation, including spoofing,
          wash trading, front-running, layering, or the dissemination of false
          or misleading information; (b) manipulate the operation of the
          Protocol, including its oracle, liquidation, or governance mechanisms;
          or (c) exploit any bug, error, or vulnerability of the Protocol for
          the purpose of obtaining cryptoassets or rights to which you are not
          entitled.
        </p>
        <h4>7.3 Technical Misuse</h4>
        <p>
          (a) probe, scan, or test the vulnerability of the Services or any
          related infrastructure, or breach any security or authentication
          measures, other than pursuant to a formally authorized disclosure or
          bug-bounty programme; (b) interfere with, disrupt, or impose an
          unreasonable load on the Services or any related infrastructure,
          including through denial-of-service or brute-force techniques; (c)
          deploy or transmit any virus, worm, trojan horse, malware, or other
          malicious code; (d) decompile, reverse engineer, disassemble, or
          attempt to derive the source code of any proprietary component of the
          Services, except to the extent that such restriction is prohibited by
          Applicable Law or by the terms of an applicable open-source or
          business-source licence; (e) use any automated means, including bots,
          scrapers, or crawlers, to access or collect information from the
          Services except as expressly permitted by the Foundation; or (f)
          forge, alter, or obscure any header, identifier, or metadata
          associated with any communication or transaction in connection with
          the Services.
        </p>
        <h4>7.4 Impersonation and Misrepresentation</h4>
        <p>
          (a) impersonate any Person or misrepresent your affiliation with any
          Person or entity; (b) use any trademark, service mark, trade name,
          logo, or other proprietary designation of the Foundation or its
          affiliates without the Foundation's prior written consent; or (c)
          collect or harvest personal information concerning other Users without
          their express permission.
        </p>
        <h4>7.5 Enforcement</h4>
        <p>
          Without limiting any other remedy available to the Foundation, the
          Foundation may, in its sole discretion and without notice, suspend or
          terminate your access to the Services, invalidate or reverse any
          offending activity to the extent technically possible, and refer
          matters to competent authorities in response to any actual or
          suspected violation of this Section 7 or any other provision of these
          Terms.
        </p>
        <h3>8. FEES AND PAYMENTS</h3>
        <h4>8.1 Protocol Fees</h4>
        <p>
          Your use of the Protocol may require the payment of fees encoded in
          the smart contracts, including, without limitation, issuance fees,
          stability fees, redemption fees, liquidation penalties, and other
          charges (collectively, “Protocol Fees”). Protocol Fees are set by, and
          may be modified in accordance with, the governance rules of the
          Protocol. The Foundation does not set or collect Protocol Fees in its
          own right, except to the extent expressly provided in the
          Documentation.
        </p>
        <h4>8.2 Network Fees</h4>
        <p>
          All transactions on public blockchains require the payment of network
          transaction fees (commonly known as “gas fees”). You are solely
          responsible for paying all gas fees associated with any transaction
          you initiate, regardless of whether such transaction succeeds. The
          Foundation does not receive, reimburse, or control gas fees.
        </p>
        <h4>8.3 Foundation Fees</h4>
        <p>
          The Foundation does not currently charge a fee for access to the Site
          or the Interface. The Foundation reserves the right to introduce fees
          for specific Services in the future, upon reasonable notice posted on
          the Site.
        </p>
        <h4>8.4 Taxes</h4>
        <p>
          All fees and amounts payable by you are exclusive of any taxes, which
          are your sole responsibility. You shall indemnify and hold harmless
          the Foundation Parties in respect of any tax liability arising out of
          your use of the Services.
        </p>
        <h3>9. INTELLECTUAL PROPERTY</h3>
        <h4>9.1 Ownership</h4>
        <p>
          The Foundation and its licensors own all right, title, and interest in
          and to the Site, the Interface, the Documentation, and all associated
          software, text, graphics, images, trademarks, service marks, logos,
          trade dress, and other intellectual property, other than any
          components released under separate open-source or business-source
          licences, which shall be governed by their respective licence terms.
          All rights not expressly granted to you under these Terms are
          reserved.
        </p>
        <h4>9.2 Limited Licence</h4>
        <p>
          Subject to your compliance with these Terms, the Foundation grants you
          a limited, personal, non-exclusive, non-transferable,
          non-sublicensable, revocable licence to access and use the Site and
          the Interface for your own lawful, non-commercial purposes. This
          licence does not include, and you shall not, (a) copy, reproduce,
          distribute, publicly display, or create derivative works of any part
          of the Services; (b) frame, mirror, or embed the Services without the
          Foundation's prior written consent; (c) use any data-mining, robot, or
          similar data-gathering or extraction tools; or (d) use the Services
          for any commercial purpose except as expressly authorized by the
          Foundation.
        </p>
        <h4>9.3 Trademarks</h4>
        <p>
          “Vetro,” the Vetro logo, and other names and marks associated with the
          Services are trademarks of the Foundation or its affiliates. You may
          not use any such trademark in any manner that is likely to cause
          confusion, dilution, or misappropriation, or that suggests endorsement
          or affiliation by the Foundation, without the Foundation's prior
          written consent.
        </p>
        <h4>9.4 Feedback</h4>
        <p>
          If you provide the Foundation with any suggestions, ideas,
          improvements, or other feedback concerning the Services (“Feedback”),
          you hereby grant the Foundation a perpetual, irrevocable, worldwide,
          royalty-free, fully paid-up, sublicensable, and transferable licence
          to use, exploit, and incorporate such Feedback for any purpose,
          without restriction, attribution, or compensation.
        </p>
        <h4>9.5 Open-Source Components</h4>
        <p>
          Certain components of the Services and the Protocol are released under
          open-source licences. Nothing in these Terms shall restrict your
          rights under such licences with respect to those components, and to
          the extent of any conflict between these Terms and any applicable
          open-source licence as to those components, the open-source licence
          shall prevail solely with respect to the components it covers.
        </p>
        <h3>10. DISCLAIMER OF WARRANTIES</h3>
        <p className="text-b-medium">
          10.1 THE SERVICES, THE PROTOCOL, THE PROTOCOL GENERATED ASSETS, THE
          DOCUMENTATION, AND ALL RELATED CONTENT ARE PROVIDED ON AN “AS IS” AND
          “AS AVAILABLE” BASIS, WITH ALL FAULTS AND WITHOUT WARRANTY OF ANY
          KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. TO THE
          FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE FOUNDATION PARTIES
          EXPRESSLY DISCLAIM ALL WARRANTIES AND CONDITIONS, INCLUDING, WITHOUT
          LIMITATION, ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, QUIET ENJOYMENT,
          ACCURACY, COMPLETENESS, TIMELINESS, SECURITY, OR AVAILABILITY, AND ANY
          WARRANTIES ARISING OUT OF COURSE OF DEALING, COURSE OF PERFORMANCE, OR
          USAGE OF TRADE.
        </p>
        <p className="text-b-medium">
          10.2 WITHOUT LIMITING THE GENERALITY OF THE FOREGOING, THE FOUNDATION
          PARTIES MAKE NO REPRESENTATION OR WARRANTY THAT (A) THE SERVICES OR
          THE PROTOCOL WILL OPERATE UNINTERRUPTED, ERROR-FREE, SECURE, OR IN
          ACCORDANCE WITH ANY PARTICULAR SPECIFICATION; (B) THE PROTOCOL
          GENERATED ASSETS WILL BEAR ANY PARTICULAR VALUE RELATIONSHIP TO THEIR
          REFERENCE ASSET AT ANY TIME; (C) THE SERVICES WILL MEET YOUR
          REQUIREMENTS; (D) DEFECTS WILL BE CORRECTED; OR (E) ANY INFORMATION
          PROVIDED THROUGH THE SERVICES IS ACCURATE OR COMPLETE.
        </p>
        <p className="text-b-medium">
          10.3 ANY CONTENT DOWNLOADED OR OTHERWISE OBTAINED THROUGH THE USE OF
          THE SERVICES IS OBTAINED AT YOUR OWN DISCRETION AND RISK, AND YOU
          ALONE ARE RESPONSIBLE FOR ANY DAMAGE TO YOUR COMPUTER SYSTEM OR LOSS
          OF DATA RESULTING FROM THE USE OF SUCH CONTENT.
        </p>
        <h3>11. LIMITATION OF LIABILITY</h3>
        <p className="text-b-medium">
          11.1 TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
          SHALL ANY OF THE FOUNDATION PARTIES BE LIABLE TO YOU OR ANY THIRD
          PARTY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, CONSEQUENTIAL,
          OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, BUSINESS,
          GOODWILL, DATA, CRYPTOASSETS, PROTOCOL GENERATED ASSETS, OR OTHER
          INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS,
          THE SERVICES, THE PROTOCOL, THE PROTOCOL GENERATED ASSETS, OR YOUR
          INABILITY TO USE ANY OF THE FOREGOING, WHETHER BASED IN CONTRACT, TORT
          (INCLUDING NEGLIGENCE), STRICT LIABILITY, STATUTE, OR ANY OTHER LEGAL
          OR EQUITABLE THEORY, AND WHETHER OR NOT THE FOUNDATION HAS BEEN
          ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p className="text-b-medium">
          11.2 WITHOUT LIMITING THE FOREGOING, THE FOUNDATION PARTIES SHALL NOT
          BE LIABLE FOR ANY LOSS OR DAMAGE ARISING OUT OF OR IN CONNECTION WITH
          (A) USER ERROR, INCLUDING FORGOTTEN OR LOST PRIVATE KEYS, INCORRECTLY
          CONSTRUCTED TRANSACTIONS, OR MISTYPED WALLET ADDRESSES; (B)
          UNAUTHORIZED ACCESS TO A USER'S WALLET, DEVICE, OR ACCOUNTS; (C)
          SERVER OR BLOCKCHAIN FAILURE, DATA LOSS, OR NETWORK CONGESTION; (D)
          DEFECTS, ERRORS, OR VULNERABILITIES IN THE SMART CONTRACTS COMPRISING
          THE PROTOCOL; (E) ORACLE FAILURE OR MANIPULATION; (F) MARKET
          VOLATILITY, DEVIATION OF A PROTOCOL GENERATED ASSET FROM ITS REFERENCE
          VALUE, OR LIQUIDATION; (G) THE ACTS OR OMISSIONS OF ANY THIRD PARTY,
          INCLUDING ANY PROVIDER OF THIRD-PARTY SERVICES; OR (H) ANY REGULATORY
          ACTION, CHANGE IN APPLICABLE LAW, OR FORCE MAJEURE EVENT.
        </p>
        <p className="text-b-medium">
          11.3 TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE TOTAL
          AGGREGATE LIABILITY OF THE FOUNDATION PARTIES ARISING OUT OF OR IN
          CONNECTION WITH THESE TERMS OR YOUR USE OF THE SERVICES SHALL NOT
          EXCEED THE GREATER OF (I) ONE HUNDRED UNITED STATES DOLLARS (US$100);
          OR (II) THE AMOUNT OF FEES, IF ANY, ACTUALLY PAID BY YOU TO THE
          FOUNDATION IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT
          GIVING RISE TO THE CLAIM.
        </p>
        <p className="text-b-medium">
          11.4 SOME JURISDICTIONS DO NOT PERMIT THE EXCLUSION OR LIMITATION OF
          CERTAIN WARRANTIES OR DAMAGES. ACCORDINGLY, SOME OF THE EXCLUSIONS AND
          LIMITATIONS SET OUT IN SECTIONS 10 AND 11 MAY NOT APPLY TO YOU. IN
          SUCH CASES, THE LIABILITY OF THE FOUNDATION PARTIES SHALL BE LIMITED
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.
        </p>
        <p>
          The exclusions and limitations set out in Sections 10 and 11 are
          fundamental elements of the basis of the bargain between you and the
          Foundation and shall apply even if any limited remedy set out in these
          Terms is found to have failed of its essential purpose.
        </p>
        <h3>12. INDEMNIFICATION</h3>
        <p>
          You agree to indemnify, defend, and hold harmless the Foundation
          Parties from and against any and all claims, demands, actions,
          proceedings, losses, liabilities, damages, judgments, awards,
          penalties, fines, costs, and expenses (including reasonable legal and
          accounting fees) arising out of or in connection with (a) your access
          to or use of the Services; (b) your violation of these Terms; (c) your
          violation of any Applicable Law or of any right of any third party,
          including intellectual-property or privacy rights; (d) any transaction
          you initiate or effect through the Protocol; (e) any tax liability
          arising out of your activities; or (f) any misrepresentation or breach
          of warranty made by you under these Terms. The Foundation reserves the
          right, at its own expense, to assume the exclusive defense and control
          of any matter otherwise subject to indemnification by you, in which
          case you shall cooperate with the Foundation's defense of such matter.
          You shall not settle any matter without the Foundation's prior written
          consent.
        </p>
        <h3>13. TERMINATION</h3>
        <h4>13.1 Termination by You</h4>
        <p>
          You may terminate these Terms at any time by ceasing all access to and
          use of the Services and disconnecting any digital wallet from the
          Interface.
        </p>
        <h4>13.2 Termination by the Foundation</h4>
        <p>
          The Foundation may, at any time and in its sole discretion, suspend,
          restrict, or terminate your access to all or part of the Services,
          with or without notice, where it reasonably considers that (a) you
          have breached any provision of these Terms; (b) your use of the
          Services exposes or may expose the Foundation or any other Person to
          legal, regulatory, reputational, financial, or security risk; (c) such
          suspension, restriction, or termination is required by Applicable Law
          or by any competent authority; or (d) the Foundation otherwise
          determines, in its sole discretion, that it is not commercially viable
          or appropriate to continue providing the Services to you.
        </p>
        <h4>13.3 Effect of Termination</h4>
        <p>
          Termination of these Terms shall not affect any rights or obligations
          that accrued prior to termination. The provisions of Sections 1, 2.2,
          3.4, 4, 5, 6, 7, 9, 10, 11, 12, 13.3, 14, 15, 16, and 17, together
          with any other provisions which by their nature are intended to
          survive, shall survive termination of these Terms.
        </p>
        <h3>14. FORCE MAJEURE</h3>
        <p>
          The Foundation Parties shall not be liable for any failure or delay in
          the performance of any obligation under these Terms to the extent that
          such failure or delay results from circumstances beyond their
          reasonable control, including, without limitation, acts of God,
          natural disasters, war (whether declared or not), terrorism, civil
          unrest, governmental action or inaction, changes in Applicable Law,
          strikes, labor disputes, power outages, telecommunications failures,
          blockchain-network failures, forks or consensus events, cyberattacks,
          epidemics, pandemics, and public-health emergencies.
        </p>
        <h3>15. DISPUTE RESOLUTION</h3>
        <h4>15.1 Informal Resolution</h4>
        <p>
          In the event of any dispute, controversy, or claim arising out of or
          in connection with these Terms, the Services, or the Protocol (each, a
          “Dispute”), the parties shall first attempt in good faith to resolve
          the Dispute through informal negotiation. A party wishing to commence
          such negotiation shall provide the other party with written notice
          setting out the nature and basis of the Dispute and the relief sought
          (the “Dispute Notice”). Dispute Notices to the Foundation shall be
          addressed to the contact address published on the Site. If the Dispute
          is not resolved within sixty (60) days after delivery of the Dispute
          Notice, either party may commence arbitration in accordance with
          Section 15.2. Compliance with this informal-resolution procedure is a
          condition precedent to the commencement of any arbitration.
        </p>
        <h4>15.2 Binding Individual Arbitration</h4>
        <p>
          Subject to Section 15.1 and to the exceptions set out in Section 15.4,
          each Dispute shall be finally resolved by binding individual
          arbitration administered by the BVI International Arbitration Centre
          (“BVI IAC”) in accordance with its rules then in effect (the “BVI IAC
          Rules”), which are deemed incorporated by reference into these Terms.
          The arbitration shall be conducted by a sole arbitrator appointed in
          accordance with the BVI IAC Rules. The seat of arbitration shall be
          Road Town, Tortola, British Virgin Islands. The language of the
          arbitration shall be English. Hearings may be conducted remotely to
          the extent permitted by the BVI IAC Rules. The arbitrator shall have
          exclusive authority to determine all issues relating to the
          arbitrability, scope, and enforceability of this arbitration
          agreement, subject to Section 15.3. The arbitrator's award shall be
          final and binding on the parties and may be entered and enforced in
          any court of competent jurisdiction.
        </p>
        <h4>15.3 Class Action, Collective Action, and Jury Trial Waiver</h4>
        <p>
          YOU AND THE FOUNDATION EACH AGREE THAT ANY DISPUTE SHALL BE BROUGHT
          SOLELY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR
          CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, CONSOLIDATED, OR
          REPRESENTATIVE PROCEEDING. Notwithstanding any other provision of
          these Terms or the BVI IAC Rules, the arbitrator shall have no
          authority to consolidate more than one Person's claims or to preside
          over any form of class, collective, or representative proceeding. Any
          question concerning the validity or enforceability of this waiver
          shall be decided by a court of competent jurisdiction and not by an
          arbitrator. If this waiver is found unenforceable, the entirety of
          this Section 15 shall be null and void, and the Dispute shall be
          resolved in the courts specified in Section 16. To the fullest extent
          permitted by Applicable Law, each party waives any right to a trial by
          jury in any action or proceeding relating to any Dispute.
        </p>
        <h4>15.4 Exceptions</h4>
        <p>
          Notwithstanding Section 15.2, (a) either party may bring an individual
          action in a court of competent jurisdiction to seek injunctive or
          other equitable relief for the alleged infringement or
          misappropriation of intellectual-property rights or the unauthorized
          access to, or use of, the Services; and (b) either party may bring a
          claim in small-claims court if the claim qualifies for adjudication
          therein and remains on an individual, non-representative basis.
        </p>
        <h4>15.5 Confidentiality</h4>
        <p>
          The existence, content, and outcome of any arbitration proceeding
          conducted under these Terms shall be kept strictly confidential by the
          parties and their representatives, except to the extent disclosure is
          required by Applicable Law or to enforce or challenge an arbitration
          award.
        </p>
        <h4>15.6 Costs</h4>
        <p>
          The allocation of arbitration fees, administrative costs, and legal
          fees shall be governed by the BVI IAC Rules, provided that the
          arbitrator may award reasonable legal fees and expenses to the
          prevailing party to the extent permitted by Applicable Law.
        </p>
        <h3>16. GOVERNING LAW AND JURISDICTION</h3>
        <p>
          These Terms, and any Dispute or non-contractual obligation arising out
          of or in connection with them, the Services, or the Protocol, shall be
          governed by and construed in accordance with the laws of the British
          Virgin Islands, without regard to its conflict-of-laws principles.
          Subject to Section 15, the courts of the British Virgin Islands shall
          have exclusive jurisdiction over any matter not subject to arbitration
          under these Terms, and each party irrevocably submits to the
          jurisdiction of such courts and waives any objection to venue therein.
        </p>
        <h3>17. GENERAL PROVISIONS</h3>
        <h4>17.1 Entire Agreement</h4>
        <p>
          These Terms, together with any document expressly incorporated by
          reference herein, constitute the entire agreement between you and the
          Foundation with respect to the subject matter hereof and supersede all
          prior or contemporaneous agreements, representations, warranties, and
          understandings, whether written or oral. You acknowledge that you have
          not relied on any statement, representation, or warranty not expressly
          set out in these Terms.
        </p>
        <h4>17.2 Amendments</h4>
        <p>
          The Foundation may amend or modify these Terms from time to time in
          its sole discretion by posting the revised Terms on the Site and
          updating the “Last Updated” date. Amendments take effect upon posting.
          Your continued use of the Services following any amendment constitutes
          your acceptance of the revised Terms. If you do not agree to any
          amendment, you must cease all use of the Services.
        </p>
        <h4>17.3 Severability</h4>
        <p>
          If any provision of these Terms is held by a court or arbitrator of
          competent jurisdiction to be invalid, illegal, or unenforceable, the
          remaining provisions shall continue in full force and effect, and the
          invalid, illegal, or unenforceable provision shall be modified to the
          minimum extent necessary to render it valid, legal, and enforceable
          while preserving, to the greatest extent possible, the parties'
          original intent.
        </p>
        <h4>17.4 No Waiver</h4>
        <p>
          The failure of the Foundation to enforce any right or provision of
          these Terms shall not be deemed a waiver of such right or provision.
          Any waiver shall be effective only if in writing and signed by a duly
          authorized representative of the Foundation.
        </p>
        <h4>17.5 Assignment</h4>
        <p>
          You may not assign, transfer, or delegate any of your rights or
          obligations under these Terms, by operation of law or otherwise,
          without the Foundation's prior written consent. Any purported
          assignment in contravention of this provision shall be null and void.
          The Foundation may freely assign, transfer, or delegate its rights and
          obligations under these Terms in whole or in part, including in
          connection with a merger, acquisition, corporate reorganization, or
          sale of all or substantially all of its assets.
        </p>
        <h4>17.6 Notices</h4>
        <p>
          Any notice or other communication to be given by the Foundation under
          these Terms may be given by posting on the Site, by email to the
          address (if any) provided by you, or by such other means as the
          Foundation may determine. Notices to the Foundation shall be delivered
          to the contact address published on the Site.
        </p>
        <h4>17.7 Relationship of the Parties</h4>
        <p>
          Nothing in these Terms shall be construed to create any partnership,
          joint venture, agency, fiduciary, employment, or similar relationship
          between you and the Foundation. The Foundation owes no fiduciary
          duties to you, and any such duties that might otherwise arise at law
          or in equity are hereby irrevocably disclaimed and waived to the
          fullest extent permitted by Applicable Law.
        </p>
        <h4>17.8 Third-Party Rights</h4>
        <p>
          Except as expressly provided for the benefit of the Foundation
          Parties, these Terms do not confer any right or benefit on any third
          party.
        </p>
        <h4>17.9 Interpretation of Certain Terminology</h4>
        <p>
          Within the Site, the Documentation, and these Terms, the terms
          “collateral,” “debt,” “lend,” “borrow,” “refinance,” “yield,”
          “liquidate,” “credit,” “reserve,” “vault,” “reference,” and similar
          expressions are used by analogy to traditional finance to describe the
          deterministic, automated operation of the Protocol's smart contracts.
          Such terms are not intended to be interpreted in accordance with their
          customary legal meanings or as defined under any body of commercial,
          banking, securities, payment-services, electronic-money, or
          financial-services law.
        </p>
        <h4>17.10 Language</h4>
        <p>
          These Terms are executed in the English language. Any translation is
          provided for convenience only, and the English version shall prevail
          in the event of any conflict or inconsistency.
        </p>
        <h4>17.11 Contact</h4>
        <p>
          Questions regarding these Terms may be directed to the Foundation
          through the contact channels published at{" "}
          <strong>https://vetro.org.</strong>
        </p>
        <p className="text-b-medium mx-auto flex items-center italic">
          — END OF TERMS OF USE —
        </p>
        <div className="text-b-medium mx-auto flex flex-col items-center">
          <p className="text-gray-900">Vetro Service & Support Ltd.</p>
          <p className="italic">
            A company incorporated under the laws of the British Virgin Islands
          </p>
          <p>https://vetro.org | https://app.vetro.org</p>
        </div>
      </div>
    </div>
  );
};
