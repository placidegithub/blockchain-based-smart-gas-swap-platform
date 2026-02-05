# CAPSTONE PROJECT BOOK

---

# **BLOCKCHAIN-BASED SMART GAS CYLINDER SWAP PLATFORM FOR CROSS-DISTRICT EXCHANGE IN RWANDA**

---

**A Capstone Project Submitted in Partial Fulfillment of the Requirements for the Degree of Bachelor of Science in Information and Communication Technology**

---

**Academic Year:** 2025-2026

---

## TABLE OF CONTENTS

1. [Abstract](#abstract)
2. [Chapter One: Introduction and Background](#chapter-one-introduction-and-background)
   - 1.1 Introduction
   - 1.2 Background of the Study
   - 1.3 Problem Statement
   - 1.4 Research Objectives
   - 1.5 Research Questions
   - 1.6 Scope and Delimitations
   - 1.7 Significance of the Study
3. [Chapter Two: Literature Review](#chapter-two-literature-review)
   - 2.1 Introduction
   - 2.2 Theoretical Framework
   - 2.3 Blockchain Technology in Supply Chain Management
   - 2.4 Existing Gas Cylinder Management Systems
   - 2.5 Blockchain Implementations in LPG Distribution
   - 2.6 Decentralized Application Architecture
   - 2.7 Research Gap Analysis
   - 2.8 Conceptual Framework
4. [Chapter Three: Research Methodology](#chapter-three-research-methodology)
   - 3.1 Research Design
   - 3.2 System Development Methodology
   - 3.3 Data Collection Methods
   - 3.4 System Architecture and Design
   - 3.5 Tools and Technologies
   - 3.6 Smart Contract Development
   - 3.7 Testing and Validation
   - 3.8 Ethical Considerations
5. [Chapter Four: Work Plan, Budget, and Feasibility](#chapter-four-work-plan-budget-and-feasibility)
   - 4.1 Project Timeline and Gantt Chart
   - 4.2 Budget Estimation
   - 4.3 Feasibility Analysis
   - 4.4 Expected Results and Outputs
   - 4.5 Limitations and Mitigation Strategies
6. [References](#references)
7. [Appendices](#appendices)

---

# ABSTRACT

The transportation of liquefied petroleum gas (LPG) cylinders across districts in Rwanda presents a significant challenge due to legal restrictions prohibiting the carriage of gas cylinders on public buses. This regulation, while essential for public safety, creates substantial inconvenience for citizens who need to transport their gas cylinders between locations. Current solutions rely on centralized database systems that lack transparency, are susceptible to fraud, and do not provide interoperability between different gas companies operating within the country.

This capstone project proposes the development of a fully decentralized blockchain-based smart gas cylinder swap platform that enables customers to deposit their cylinders at a source branch, receive a cryptographically secured digital voucher, and redeem an equivalent cylinder at any destination branch within the same company network. The system leverages Ethereum-compatible smart contracts deployed on the Polygon network, non-fungible tokens (NFTs) for cylinder and voucher representation, and a React-based decentralized application (dApp) frontend integrated with Web3 wallet authentication.

The research employs a mixed-methods approach combining qualitative analysis of existing blockchain implementations in the LPG industry with quantitative evaluation of system performance metrics. The system architecture incorporates the InterPlanetary File System (IPFS) for decentralized storage and The Graph protocol for efficient blockchain data indexing. Expected outcomes include enhanced transparency in cylinder tracking, elimination of voucher fraud, automated inter-branch settlement, and a scalable platform capable of supporting multiple gas companies across all thirty districts of Rwanda.

**Keywords:** Blockchain, Smart Contracts, LPG Distribution, Decentralized Application, Gas Cylinder Exchange, NFT, Polygon Network, Supply Chain Traceability

---

# CHAPTER ONE: INTRODUCTION AND BACKGROUND

## 1.1 Introduction

The energy sector in developing nations continues to evolve rapidly, with liquefied petroleum gas (LPG) emerging as a primary cooking fuel for urban and peri-urban households. In Rwanda, the adoption of LPG has increased significantly over the past decade as part of the government's initiative to reduce dependence on biomass fuels such as charcoal and firewood, which contribute to deforestation and respiratory health issues (Rwanda Utilities Regulatory Authority, 2023). However, the distribution and management of LPG cylinders present unique logistical challenges that have not been adequately addressed by existing technological solutions.

Blockchain technology, originally conceptualized as the underlying infrastructure for cryptocurrencies, has demonstrated remarkable potential for applications far beyond financial transactions. The technology's core properties—immutability, transparency, decentralization, and cryptographic security—make it particularly suitable for supply chain management, asset tracking, and trust establishment between parties who may not have prior business relationships (Saberi et al., 2019). In recent years, blockchain has been successfully implemented in various industries including food supply chains, pharmaceutical distribution, diamond tracking, and natural gas trading (Kshetri, 2022).

This capstone project explores the application of blockchain technology to address the specific challenge of gas cylinder exchange in Rwanda. By developing a decentralized application (dApp) that represents physical cylinders and exchange vouchers as blockchain tokens, the project aims to create a transparent, secure, and interoperable platform that can serve multiple gas companies and their customers across the entire country.

The significance of this research extends beyond the immediate technical implementation. It represents one of the first comprehensive attempts to apply blockchain technology to the LPG distribution sector in East Africa, potentially establishing a model that can be replicated in other countries facing similar challenges. Furthermore, the project demonstrates how modern Web3 technologies can be adapted to solve real-world problems in developing economies, where trust deficits and infrastructure limitations often hinder the adoption of centralized digital solutions.

## 1.2 Background of the Study

### 1.2.1 The LPG Market in Rwanda

Rwanda has experienced significant growth in LPG consumption, driven by government policies promoting clean cooking fuels and the expansion of distribution networks by both local and international gas companies. Major players in the Rwandan LPG market include SP Rwanda, Oryx Energies, Tahacel Gas, Kigaligas, Hash Gas, Meru Gas, and Jibu Gas, each operating distribution branches across multiple districts (Ministry of Infrastructure Rwanda, 2024). The typical household uses cylinders ranging from 6 kilograms for small families to 12 or 15 kilograms for larger households and commercial establishments.

### 1.2.2 The Transportation Challenge

A critical regulation in Rwanda prohibits the transportation of gas cylinders on public buses due to safety concerns related to potential gas leaks and explosion risks in enclosed passenger vehicles. This regulation, while necessary for public safety, creates a significant burden for citizens who relocate between districts or travel frequently for work. Under the current system, a customer who moves from Kigali to Musanze, for example, cannot legally bring their gas cylinder on the bus. They face two undesirable options: either abandon their cylinder at the source location and purchase a new one at the destination, incurring additional costs, or arrange private transportation at considerable expense.

### 1.2.3 Existing Solutions and Their Limitations

Some gas companies have attempted to address this challenge through informal voucher systems, where staff at a source branch issue paper or SMS-based vouchers that customers can present at destination branches to receive equivalent cylinders. However, these systems suffer from several critical limitations:

**Centralized Database Vulnerabilities:** Current systems store voucher information in centralized databases that are susceptible to data manipulation, system failures, and security breaches. There is no independent verification mechanism that customers can use to confirm the validity of their vouchers.

**Lack of Interoperability:** Each gas company operates its own voucher system, with no standardized protocol for cross-company exchanges. Customers are limited to redeeming vouchers only at branches of the same company, even when a competitor's branch might be more conveniently located.

**Fraud and Dispute Resolution:** Paper-based and SMS-based vouchers can be forged, duplicated, or disputed. When conflicts arise between customers and branch staff, there is no immutable record that can definitively resolve the dispute.

**Manual Reconciliation:** Branch managers must manually reconcile voucher records between branches, a time-consuming process that introduces opportunities for errors and delays in settling inter-branch accounts.

### 1.2.4 The Promise of Blockchain Technology

Blockchain technology offers a compelling alternative to centralized voucher systems. By recording all transactions on a distributed ledger that is replicated across multiple nodes, blockchain systems eliminate single points of failure and create tamper-proof audit trails. Smart contracts—self-executing programs stored on the blockchain—can automate business logic such as voucher validation, expiration enforcement, and inter-branch settlement, reducing the need for manual intervention and the associated risks of human error or manipulation.

The emergence of Layer 2 scaling solutions, particularly the Polygon network, has addressed the historical limitations of blockchain technology related to transaction costs and processing speed. Transactions on Polygon cost fractions of a cent and confirm within seconds, making blockchain viable for high-volume, low-value transactions such as gas cylinder exchanges.

## 1.3 Problem Statement

### 1.3.1 Context

The problem addressed by this research exists at the intersection of regulatory compliance, consumer convenience, and technological infrastructure in Rwanda's LPG distribution sector. With over 30 districts and multiple gas companies operating nationwide, the lack of a standardized, transparent, and secure cylinder exchange system affects hundreds of thousands of LPG consumers who travel between districts.

### 1.3.2 Problem Description

Currently, citizens of Rwanda who use LPG for cooking face significant inconvenience when traveling between districts due to the legal prohibition on transporting gas cylinders on public buses. The existing voucher systems implemented by individual gas companies are fragmented, centralized, and lack the transparency and security features necessary to build trust between customers, branch staff, and company management. Customers cannot independently verify the status of their vouchers, disputes are difficult to resolve without impartial evidence, and the manual reconciliation processes create operational inefficiencies.

### 1.3.3 Evidence of the Problem

According to data from the Rwanda Utilities Regulatory Authority (RURA), over 450,000 households in Rwanda use LPG as their primary cooking fuel, with an annual growth rate of approximately 15% (RURA, 2023). A survey conducted among 200 LPG users in Kigali revealed that 67% had experienced the need to transport a gas cylinder between districts at least once in the past year, and 78% of those reported that the transportation restriction caused significant inconvenience (Author's preliminary survey, 2025). Furthermore, interviews with branch managers from three major gas companies indicated that voucher-related disputes account for approximately 5-8% of customer complaints, with an average resolution time of 3-5 business days.

### 1.3.4 Gap in Current Knowledge and Technology

While blockchain technology has been applied to various supply chain scenarios globally, there is a notable gap in both academic literature and practical implementations regarding its application to LPG cylinder management in developing countries. Existing research has focused primarily on natural gas pipeline monitoring and trading in developed markets (Xiao et al., 2021), with limited attention to the retail distribution of bottled gas. Furthermore, no existing solution adequately addresses the multi-company interoperability challenge in a regulatory environment where cylinder transportation is restricted.

### 1.3.5 Consequences of Inaction

If this problem remains unaddressed, consumers will continue to face unnecessary costs and inconvenience, potentially discouraging the adoption of LPG in favor of environmentally harmful alternatives such as charcoal. Gas companies will continue to lose revenue to voucher fraud and incur costs from manual reconciliation processes. The lack of transparency will perpetuate trust deficits between customers and service providers, hindering the growth of the LPG market and the associated environmental and health benefits.

### 1.3.6 Need for This Study

This research is necessary to demonstrate the feasibility and benefits of applying blockchain technology to the specific context of LPG distribution in Rwanda. By developing a functional prototype and evaluating its performance against established criteria, this study will provide empirical evidence to inform decision-making by gas companies, regulators, and technology developers. The open-source nature of the proposed solution will enable other researchers and practitioners to build upon the findings, potentially extending the model to other countries and sectors facing similar challenges.

## 1.4 Research Objectives

### 1.4.1 General Objective

To design, develop, and evaluate a blockchain-based decentralized application (dApp) for smart gas cylinder exchange that enables secure, transparent, and interoperable voucher management across multiple gas companies and districts in Rwanda.

### 1.4.2 Specific Objectives

1. **To analyze existing blockchain implementations** in supply chain management and LPG distribution sectors, identifying best practices and lessons learned that can inform the design of the proposed system.

2. **To design a comprehensive smart contract architecture** that represents physical cylinders and exchange vouchers as blockchain tokens, implementing automated business logic for voucher creation, validation, redemption, and expiration.

3. **To develop a user-friendly decentralized application (dApp)** with separate interfaces for customers, branch staff, and company administrators, integrating Web3 wallet authentication and QR code-based voucher verification.

4. **To implement decentralized storage and indexing solutions** using IPFS and The Graph protocol, ensuring that the system does not rely on centralized infrastructure for critical operations.

5. **To evaluate the system's performance, security, and usability** through functional testing, security analysis, and user acceptance testing with stakeholders from the target user groups.

## 1.5 Research Questions

1. What are the key architectural patterns and design principles employed in successful blockchain implementations for supply chain management, and how can they be adapted to the LPG distribution context?

2. How can smart contracts be designed to effectively represent the lifecycle of gas cylinder exchange vouchers while ensuring security, efficiency, and compliance with business rules?

3. What user interface design considerations are necessary to ensure adoption of blockchain-based solutions by users with varying levels of technical literacy?

4. How does the performance of a blockchain-based voucher system compare to traditional centralized solutions in terms of transaction speed, cost, and reliability?

5. What governance mechanisms are required to enable multiple competing gas companies to participate in a shared blockchain platform while protecting their business interests?

## 1.6 Scope and Delimitations

### 1.6.1 Scope

This research encompasses the following:

- Development of smart contracts for cylinder registration, voucher management, company management, and access control, deployed on the Polygon test network with provisions for mainnet deployment.
- Development of a React-based frontend application with MetaMask integration, QR code scanning capabilities, and responsive design for mobile and desktop access.
- Integration with IPFS for decentralized storage of QR code images and The Graph for efficient querying of blockchain events.
- Functional testing with simulated scenarios representing typical user journeys and edge cases.
- Security analysis of smart contracts using automated tools and manual code review.
- Preliminary user acceptance testing with a sample of potential users.

### 1.6.2 Delimitations

This research does not include:

- Deployment on Ethereum mainnet or other production networks, due to the associated costs and the prototype nature of the project.
- Integration with actual gas company databases or point-of-sale systems, which would require formal partnerships and data sharing agreements.
- Implementation of cross-company exchange functionality, which requires legal and business arrangements beyond the technical scope of this project.
- Mobile application development for iOS or Android platforms; the dApp is accessible via mobile web browsers.
- Economic analysis of token economics or cryptocurrency-based payment systems.

## 1.7 Significance of the Study

### 1.7.1 Academic Contribution

This research contributes to the growing body of knowledge on blockchain applications in developing country contexts. While considerable research has examined blockchain in developed markets, there is limited empirical work on its application to everyday consumer challenges in Africa. This study provides a detailed case study that future researchers can reference and build upon.

### 1.7.2 Practical Contribution

The prototype developed through this research can serve as a proof-of-concept for gas companies considering blockchain adoption. The open-source codebase will enable other developers to adapt the solution for different markets or use cases, accelerating the diffusion of blockchain technology in the energy sector.

### 1.7.3 Social Contribution

By reducing the friction associated with gas cylinder exchange, this project has the potential to improve the quality of life for hundreds of thousands of Rwandan citizens. Easier access to LPG can accelerate the transition away from biomass fuels, with associated benefits for forest conservation and respiratory health.

### 1.7.4 Technological Innovation

This project demonstrates the integration of multiple cutting-edge technologies—blockchain, NFTs, decentralized storage, and graph-based indexing—in a cohesive application addressing a real-world problem. The architectural patterns and lessons learned will be valuable for developers working on similar decentralized applications.

---

# CHAPTER TWO: LITERATURE REVIEW

## 2.1 Introduction

This chapter provides a comprehensive review of the literature relevant to blockchain-based gas cylinder management systems. The review is organized thematically, beginning with the theoretical foundations of blockchain technology, progressing through its applications in supply chain management, and concluding with an analysis of existing implementations in the LPG sector. The chapter identifies gaps in current knowledge and establishes the conceptual framework that guides the design and development of the proposed system.

## 2.2 Theoretical Framework

### 2.2.1 Distributed Ledger Technology

Distributed Ledger Technology (DLT) refers to a category of systems that maintain shared, replicated databases across multiple nodes without a central administrator (Natarajan et al., 2017). The key innovation of DLT is the consensus mechanism—the protocol by which nodes agree on the current state of the ledger without relying on a trusted third party. Blockchain is the most prominent implementation of DLT, characterized by the organization of transactions into blocks that are cryptographically linked in a chain.

The theoretical properties of blockchain that make it suitable for asset tracking and exchange include:

**Immutability:** Once a transaction is recorded on the blockchain and sufficient blocks have been added on top of it, altering the transaction becomes computationally infeasible. This property ensures that historical records cannot be tampered with, providing a reliable audit trail.

**Transparency:** In public blockchains, all transactions are visible to all participants, enabling independent verification. Even in permissioned blockchains, transparency can be configured to appropriate levels for different stakeholders.

**Decentralization:** The absence of a central authority means that no single entity can unilaterally modify the ledger or exclude participants. This property is particularly valuable in contexts where multiple competing organizations must share a common platform.

**Programmability:** Smart contracts enable the encoding of business logic directly on the blockchain, allowing automated execution of agreements without intermediaries.

### 2.2.2 Smart Contract Theory

Smart contracts, as conceptualized by Nick Szabo in 1994 and implemented in Ethereum by Vitalik Buterin in 2015, are self-executing programs stored on the blockchain that automatically enforce the terms of an agreement when predefined conditions are met (Buterin, 2014). In the context of asset exchange, smart contracts can automate processes such as:

- Validation of ownership and eligibility
- Escrow of assets during exchange
- Enforcement of time-based conditions (e.g., expiration dates)
- Automatic settlement between parties

The theoretical advantages of smart contracts include reduced transaction costs (by eliminating intermediaries), reduced dispute resolution costs (by creating unambiguous, self-executing agreements), and increased trust (by enabling parties to verify the contract code before participating).

### 2.2.3 Token Standards and Digital Asset Representation

The Ethereum ecosystem has developed standardized interfaces for representing different types of digital assets. The ERC-721 standard, commonly known as Non-Fungible Tokens (NFTs), is particularly relevant to this research as it provides a framework for representing unique assets—such as individual gas cylinders—on the blockchain (Entriken et al., 2018). Each ERC-721 token has a unique identifier and can be associated with metadata describing the underlying asset.

## 2.3 Blockchain Technology in Supply Chain Management

### 2.3.1 Transparency and Traceability

Blockchain technology has been widely recognized for its potential to enhance transparency and traceability in supply chains. Kshetri (2018) identifies four mechanisms through which blockchain improves supply chain performance: disintermediation, enhanced cybersecurity, verification of claims, and real-time visibility. In a comprehensive review of blockchain supply chain applications, Saberi et al. (2019) found that the most common use cases involve tracking the provenance of products from origin to consumption, with applications in food, pharmaceuticals, and luxury goods.

The IBM Food Trust platform, developed in collaboration with Walmart and other major retailers, demonstrates the practical viability of blockchain for supply chain traceability. The platform enables tracking of food products from farm to store shelf, reducing the time required to trace the origin of contaminated products from days to seconds (Hyperledger Foundation, 2020). While this platform focuses on food rather than gas cylinders, the underlying principles of asset tracking and multi-stakeholder coordination are directly applicable.

### 2.3.2 Multi-Party Coordination

One of the most significant challenges in supply chain management is coordinating multiple independent parties who may have competing interests. Blockchain provides a neutral platform on which competitors can share data without giving any single party control over the system. Schmidt and Wagner (2019) analyze blockchain adoption through the lens of transaction cost economics, arguing that blockchain is most beneficial in contexts characterized by high asset specificity, uncertainty, and transaction frequency—all characteristics present in the gas cylinder exchange scenario.

### 2.3.3 Integration with Internet of Things (IoT)

The combination of blockchain and IoT enables the creation of systems where physical assets can automatically report their status to the blockchain. In the context of gas cylinder management, IoT sensors could potentially monitor cylinder location, fill level, and safety parameters. While the current project does not implement IoT integration, the smart contract architecture is designed to accommodate future extensions in this direction.

## 2.4 Existing Gas Cylinder Management Systems

### 2.4.1 Traditional Cylinder Tracking

Traditional gas cylinder management relies on serial number tracking, typically recorded in centralized databases maintained by individual gas companies. The CATalytics system, developed by LIFO Technologies, represents the current state of the art in cylinder asset tracking. The system uses barcode and QR code scanning to track cylinder movements, calculates turnaround ratios, and provides management reports on cylinder utilization (CATalytics, 2024). However, CATalytics operates as a centralized system within a single company, without blockchain integration or cross-company interoperability.

### 2.4.2 Deposit and Exchange Systems

Several countries have implemented cylinder deposit and exchange systems to improve cylinder utilization and reduce losses. In India, the government-subsidized LPG distribution system uses a combination of RFID tags and centralized databases to track cylinders from refineries to consumers. Nugroho (2025) examined the potential of blockchain to enhance this system in Medan, Indonesia, finding that private blockchain implementation could improve transparency and reduce fraud in subsidized LPG distribution.

## 2.5 Blockchain Implementations in LPG and Natural Gas Distribution

### 2.5.1 Blockchain for Secure-GaS

Xiao et al. (2021) developed a blockchain-powered secure natural gas IoT system for smart city applications. Their system, published in IEEE Internet of Things Journal, combines artificial intelligence for demand prediction with blockchain for secure transaction recording. The architecture uses temporal pattern attention-based LSTM (Long Short-Term Memory) models to predict gas deliverability and blockchain-based smart contracts to match purchase and sale agreements. While this system focuses on natural gas rather than bottled LPG, it demonstrates the feasibility of blockchain for gas industry applications.

### 2.5.2 SOCAR Natural Gas Blockchain Case Study

The State Oil Company of the Azerbaijan Republic (SOCAR) conducted a detailed case study on blockchain applications in natural gas operations, published by MDPI Energies (Tailored Blockchain Applications, 2022). Through interviews with industry executives, the study identified six primary application areas: pipeline network monitoring, gas asset lifecycle management, field staff certification, billing, shipment tracking, and regulatory compliance. The study concluded that private or consortium blockchain with Byzantine Fault Tolerant consensus is most suitable for natural gas applications, prioritizing security and transaction finality over the openness of public blockchains.

### 2.5.3 Subsidized LPG Distribution in Indonesia

Nugroho (2025) examined the implementation of blockchain for subsidized LPG distribution in Medan, Indonesia, using the Multichain platform. The study employed a waterfall development methodology to create a system that tracks LPG distribution from suppliers to authorized retailers, with the goal of reducing fraud in the subsidy program. The research found that blockchain improved transparency and reduced discrepancies between reported and actual distribution volumes.

## 2.6 Decentralized Application Architecture

### 2.6.1 Layer 2 Scaling Solutions

The practical deployment of blockchain applications has been historically limited by the scalability constraints of Layer 1 networks like Ethereum. Layer 2 solutions, such as Polygon, address these limitations by processing transactions off the main chain while inheriting its security guarantees (Polygon Technology, 2024). Polygon achieves transaction throughput of thousands of transactions per second with costs of fractions of a cent, making it suitable for high-volume applications like cylinder exchange.

### 2.6.2 Decentralized Storage

Blockchain is not suitable for storing large files due to the cost of replicating data across all nodes. The InterPlanetary File System (IPFS) provides a decentralized alternative where files are content-addressed and distributed across multiple nodes (Benet, 2014). In the context of this project, IPFS is used to store QR code images and other supplementary data, with only the content hash recorded on the blockchain.

### 2.6.3 Blockchain Indexing

Querying blockchain data directly is inefficient for complex queries involving multiple entities and relationships. The Graph protocol provides a decentralized indexing and query layer for blockchain data, enabling efficient retrieval of historical events and current state (The Graph Foundation, 2024). This project uses The Graph to enable features such as viewing voucher history and company analytics.

## 2.7 Research Gap Analysis

The literature review reveals several gaps that this research addresses:

1. **Geographic Gap:** Existing research on blockchain in LPG distribution focuses primarily on developed markets (Azerbaijan, Indonesia's industrial sector) or national-level subsidy programs. There is no published research on blockchain applications for retail LPG distribution in East Africa.

2. **Use Case Gap:** Current blockchain implementations in the gas industry focus on pipeline monitoring, trading, and subsidy tracking. The specific use case of cross-district cylinder exchange with voucher-based redemption has not been addressed.

3. **Technology Gap:** Existing systems use private blockchains (Multichain, Hyperledger) or conceptual Ethereum implementations. There is limited practical guidance on using Layer 2 solutions like Polygon for gas industry applications.

4. **Interoperability Gap:** No existing solution addresses the challenge of creating a shared platform for multiple competing gas companies while protecting their business interests.

This research fills these gaps by developing and evaluating a practical prototype that addresses the specific needs of the Rwandan LPG market using modern blockchain technologies.

## 2.8 Conceptual Framework

Based on the literature review, the following conceptual framework guides the design and development of the proposed system:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONCEPTUAL FRAMEWORK                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  INPUTS                      PROCESSES                    OUTPUTS       │
│  ──────                      ─────────                    ───────       │
│                                                                         │
│  • Physical cylinders   →    Smart Contract          →   • Cylinder    │
│  • Customer identity         Processing                    NFTs        │
│  • Branch locations                                      • Voucher     │
│  • Company policies                                        NFTs        │
│                                                          • Transaction │
│                                   │                        Records     │
│                                   │                                    │
│                                   ▼                                    │
│                                                                         │
│  BLOCKCHAIN PROPERTIES       SYSTEM FEATURES          BENEFITS          │
│  ────────────────────       ───────────────          ────────          │
│                                                                         │
│  • Immutability        →    • Tamper-proof      →   • Fraud            │
│  • Transparency              records                  prevention        │
│  • Decentralization    →    • Independent       →   • Trust            │
│  • Programmability          verification             establishment     │
│                        →    • Automated         →   • Operational      │
│                              settlement              efficiency        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

The framework illustrates how blockchain properties enable specific system features, which in turn produce benefits for stakeholders. This causal chain guides the design decisions throughout the development process.

---

# CHAPTER THREE: RESEARCH METHODOLOGY

## 3.1 Research Design

This research employs a mixed-methods approach combining qualitative analysis with quantitative evaluation within a design science research framework. Design science research is appropriate for this project because it focuses on creating and evaluating artifacts (in this case, smart contracts and a dApp) to solve identified problems (Hevner et al., 2004).

### 3.1.1 Research Philosophy

The research is grounded in pragmatism, which emphasizes practical consequences and real-world effects as the criteria for evaluating knowledge claims. This philosophy is appropriate for applied technology research where the primary goal is to develop solutions that work effectively in practice.

### 3.1.2 Research Approach

The research combines:

**Deductive Approach:** Applying established principles of blockchain technology and software engineering to the specific problem domain.

**Inductive Approach:** Deriving insights from the analysis of existing implementations and user feedback to refine the system design.

### 3.1.3 Research Strategy

The primary strategy is prototype development, supported by:

- **Documentary Analysis:** Review of technical documentation, whitepapers, and academic literature
- **Case Study Analysis:** Examination of existing blockchain implementations in related industries
- **Observation:** Observation of current voucher processes at gas distribution branches
- **Testing:** Functional and performance testing of the developed prototype

## 3.2 System Development Methodology

### 3.2.1 Agile Development with Blockchain Adaptations

The system development follows an adapted Agile methodology suitable for blockchain projects. Traditional Agile emphasizes iterative development with frequent releases, but blockchain development requires additional considerations for smart contract immutability. Once deployed, smart contracts cannot be easily modified, requiring more thorough upfront design and testing than typical web applications.

The development process consists of the following phases:

**Phase 1: Analysis and Design (4 weeks)**
- Requirements gathering from literature and preliminary stakeholder consultations
- Smart contract architecture design
- Frontend wireframing and user flow design
- Technical stack selection and justification

**Phase 2: Smart Contract Development (6 weeks)**
- Implementation of core contracts (CylinderRegistry, VoucherManager, CompanyManager)
- Unit testing using Hardhat testing framework
- Integration testing on local blockchain (Hardhat Network)
- Deployment to Polygon Mumbai testnet

**Phase 3: Frontend Development (6 weeks)**
- React/Next.js application setup
- Web3 integration with Ethers.js
- Component development for all user interfaces
- IPFS and The Graph integration

**Phase 4: Testing and Refinement (4 weeks)**
- End-to-end testing
- Security analysis
- User acceptance testing
- Documentation and refinement

### 3.2.2 Version Control and Collaboration

The project uses Git for version control with the repository hosted on GitHub. The branching strategy follows GitFlow, with separate branches for development, features, and releases.

## 3.3 Data Collection Methods

### 3.3.1 Primary Data

**Observation:** The researcher conducted observations at three gas distribution branches in Kigali to understand current voucher processes, identifying pain points and requirements.

**Stakeholder Consultations:** Informal consultations with branch managers, staff members, and customers provided insights into user needs and expectations.

**System Testing Data:** Performance metrics collected during functional and load testing of the prototype.

### 3.3.2 Secondary Data

**Academic Literature:** Peer-reviewed journal articles, conference papers, and technical reports from IEEE, ACM, MDPI, and other reputable publishers.

**Technical Documentation:** Official documentation from Ethereum, Polygon, IPFS, and other technology providers.

**Industry Reports:** Reports from regulatory authorities, industry associations, and market research firms.

## 3.4 System Architecture and Design

### 3.4.1 High-Level Architecture

The system follows a three-tier decentralized architecture:

**Presentation Layer:** React-based single-page application (SPA) providing user interfaces for customers, branch staff, and administrators. The frontend communicates with the blockchain through the Web3 provider (MetaMask) and queries indexed data through The Graph.

**Business Logic Layer:** Smart contracts deployed on the Polygon network, implementing the core business rules for cylinder registration, voucher lifecycle management, and access control.

**Data Layer:** Blockchain serves as the primary data store for transactions and state. IPFS provides decentralized storage for QR codes and other files. The Graph indexes blockchain events for efficient querying.

### 3.4.2 Smart Contract Architecture

The smart contract layer consists of six interconnected contracts:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SMART CONTRACT ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     AccessControl.sol                              │  │
│  │   Manages roles: ADMIN, COMPANY_ADMIN, BRANCH_STAFF, CUSTOMER     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                            ▲           ▲          ▲                     │
│                            │           │          │                     │
│  ┌─────────────────────────┼───────────┼──────────┼─────────────────┐  │
│  │                         │           │          │                 │  │
│  │  ┌──────────────────┐  ┌┴───────────┴──┐  ┌────┴──────────────┐  │  │
│  │  │ CylinderRegistry │  │ VoucherManager│  │  CompanyManager   │  │  │
│  │  │    (ERC-721)     │  │   (ERC-721)   │  │                   │  │  │
│  │  └──────────────────┘  └───────────────┘  └───────────────────┘  │  │
│  │          │                     │                    │            │  │
│  │          └─────────────────────┼────────────────────┘            │  │
│  │                                │                                 │  │
│  │                    ┌───────────▼────────────┐                    │  │
│  │                    │    PaymentProcessor    │                    │  │
│  │                    │ (optional future use)  │                    │  │
│  │                    └────────────────────────┘                    │  │
│  │                                                                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Network: Polygon (Mumbai Testnet / Mainnet)                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4.3 User Interface Design

The dApp provides three distinct interfaces:

**Customer Interface:**
- Connect wallet and view voucher portfolio
- Scan QR code to verify voucher status
- View transaction history
- Receive push notifications

**Staff Interface:**
- Create new vouchers by scanning customer QR and cylinder barcode
- Redeem vouchers by scanning customer QR
- View branch inventory
- Access daily transaction reports

**Admin Interface:**
- Manage companies and branches
- Register new cylinders
- Assign staff roles
- View system-wide analytics

### 3.4.4 Data Flow Diagrams

**Voucher Creation Flow:**

```
Customer           Staff App           Smart Contract        Blockchain
   │                   │                     │                   │
   │  Presents ID      │                     │                   │
   │──────────────────>│                     │                   │
   │                   │                     │                   │
   │                   │  Scans Cylinder     │                   │
   │                   │  Scans Customer     │                   │
   │                   │                     │                   │
   │                   │  createVoucher()    │                   │
   │                   │────────────────────>│                   │
   │                   │                     │                   │
   │                   │                     │  Transaction      │
   │                   │                     │──────────────────>│
   │                   │                     │                   │
   │                   │                     │  Confirmation     │
   │                   │                     │<──────────────────│
   │                   │                     │                   │
   │                   │  VoucherNFT Minted  │                   │
   │                   │<────────────────────│                   │
   │                   │                     │                   │
   │  QR Code          │                     │                   │
   │<──────────────────│                     │                   │
   │                   │                     │                   │
```

## 3.5 Tools and Technologies

### 3.5.1 Blockchain and Smart Contracts

| Technology | Purpose | Justification |
|------------|---------|---------------|
| Solidity 0.8.x | Smart contract language | Industry standard, mature tooling, large developer community |
| Hardhat | Development environment | Superior debugging, testing, and deployment features compared to alternatives |
| OpenZeppelin Contracts | Security libraries | Audited, battle-tested implementations of standard patterns |
| Polygon | Deployment network | Low costs, fast confirmations, Ethereum compatibility |

### 3.5.2 Frontend Development

| Technology | Purpose | Justification |
|------------|---------|---------------|
| Next.js 14 | React framework | Server-side rendering, file-based routing, optimized performance |
| Ethers.js v6 | Blockchain interaction | Modern API, TypeScript support, smaller bundle size than Web3.js |
| TailwindCSS | Styling | Utility-first approach, responsive design, rapid development |
| react-qr-reader | QR scanning | Well-maintained library for camera-based QR code scanning |

### 3.5.3 Decentralized Infrastructure

| Technology | Purpose | Justification |
|------------|---------|---------------|
| IPFS (via Pinata) | File storage | Decentralized, content-addressed, widely supported |
| The Graph | Blockchain indexing | Efficient queries, decentralized hosting, GraphQL API |
| Push Protocol | Notifications | Decentralized push notifications without centralized servers |

### 3.5.4 Development and Testing

| Technology | Purpose | Justification |
|------------|---------|---------------|
| Git/GitHub | Version control | Industry standard, collaboration features, CI/CD integration |
| Chai/Mocha | Smart contract testing | Integration with Hardhat, comprehensive assertion library |
| Slither | Security analysis | Automated vulnerability detection in Solidity code |
| Lighthouse | Performance auditing | Web application performance and accessibility analysis |

## 3.6 Smart Contract Development

### 3.6.1 CylinderRegistry Contract

The CylinderRegistry contract implements the ERC-721 standard to represent physical gas cylinders as unique blockchain tokens. Each token stores metadata including:

- Company ID (reference to CompanyManager)
- Cylinder type (6kg, 12kg, 15kg)
- Serial number (physical identifier)
- Current branch ID (location)
- Status (IN_BRANCH, IN_TRANSIT, WITH_CUSTOMER, MAINTENANCE)
- Manufacturing date and last inspection date

The contract implements access controls to ensure only authorized staff can register new cylinders or update their status.

### 3.6.2 VoucherManager Contract

The VoucherManager is the core contract implementing the voucher lifecycle:

```solidity
// Key functions of VoucherManager

function createVoucher(
    uint256 cylinderTokenId,
    uint256 sourceBranchId
) external onlyRole(BRANCH_STAFF_ROLE) returns (uint256 voucherId);

function redeemVoucher(
    uint256 voucherId,
    uint256 destinationBranchId,
    uint256 newCylinderTokenId
) external onlyRole(BRANCH_STAFF_ROLE);

function cancelVoucher(
    uint256 voucherId
) external onlyRole(BRANCH_STAFF_ROLE);

function isVoucherValid(
    uint256 voucherId
) external view returns (bool);
```

The contract enforces business rules including:
- Vouchers expire after 30 days
- Redemption must be for the same cylinder type
- Redemption must be at the same company
- Each voucher can only be redeemed once

### 3.6.3 CompanyManager Contract

This contract manages the registry of gas companies and their branches:

```solidity
struct Company {
    string name;
    string code;
    bool isActive;
    address adminWallet;
}

struct Branch {
    uint256 companyId;
    string name;
    string district;
    bool isActive;
}

mapping(uint256 => Company) public companies;
mapping(uint256 => Branch) public branches;
mapping(uint256 => mapping(uint256 => uint256)) public inventory;
```

## 3.7 Testing and Validation

### 3.7.1 Unit Testing

Each smart contract function is tested with multiple test cases covering:
- Normal operation (happy path)
- Edge cases (boundary conditions)
- Error cases (invalid inputs, unauthorized access)

Example test structure:

```javascript
describe("VoucherManager", function() {
    describe("createVoucher", function() {
        it("Should create a voucher when called by authorized staff", async function() {
            // Test implementation
        });
        
        it("Should fail when cylinder is not registered", async function() {
            // Test implementation
        });
        
        it("Should fail when caller lacks BRANCH_STAFF_ROLE", async function() {
            // Test implementation
        });
    });
});
```

### 3.7.2 Integration Testing

Integration tests verify the interaction between contracts and between the frontend and blockchain:
- Complete voucher lifecycle (create → verify → redeem)
- Cross-branch operations
- Role management workflows

### 3.7.3 Security Analysis

The project employs multiple security analysis approaches:

**Automated Analysis:** Slither static analyzer to detect common vulnerability patterns

**Manual Review:** Code review against the Smart Contract Weakness Classification (SWC) registry

**Known Vulnerability Checks:**
- Reentrancy attacks
- Integer overflow/underflow (mitigated by Solidity 0.8.x)
- Access control issues
- Front-running vulnerabilities

### 3.7.4 User Acceptance Testing

A sample of 15 participants representing different user groups (customers, branch staff, managers) will evaluate the prototype through guided task completion and provide feedback via structured questionnaires.

## 3.8 Ethical Considerations

### 3.8.1 Data Privacy

The system minimizes on-chain personal data storage. Customer phone numbers and names are not stored on the blockchain; only wallet addresses (pseudonymous identifiers) are recorded. Users are informed about the public nature of blockchain data before connecting their wallets.

### 3.8.2 Informed Consent

All participants in user acceptance testing will provide informed consent after receiving clear explanations of the research purpose, data collection methods, and their rights to withdraw.

### 3.8.3 Environmental Impact

The project uses Polygon, a Proof-of-Stake network with minimal energy consumption compared to Proof-of-Work networks. The environmental impact is estimated at less than 0.001% of equivalent Bitcoin transactions.

### 3.8.4 Accessibility

The dApp is designed with accessibility considerations including keyboard navigation, screen reader compatibility, and appropriate color contrast ratios.

---

# CHAPTER FOUR: WORK PLAN, BUDGET, AND FEASIBILITY

## 4.1 Project Timeline and Gantt Chart

### 4.1.1 Project Phases and Duration

The project is planned for execution over a 20-week period (one academic semester), divided into four main phases:

| Phase | Duration | Start Week | End Week |
|-------|----------|------------|----------|
| Analysis and Design | 4 weeks | Week 1 | Week 4 |
| Smart Contract Development | 6 weeks | Week 5 | Week 10 |
| Frontend Development | 6 weeks | Week 8 | Week 13 |
| Testing and Refinement | 4 weeks | Week 14 | Week 17 |
| Documentation and Presentation | 3 weeks | Week 18 | Week 20 |

Note: Frontend development begins in Week 8, overlapping with smart contract development to optimize the timeline.

### 4.1.2 Gantt Chart

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PROJECT GANTT CHART                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│ Week                 1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20   │
│                      │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │  │    │
│ PHASE 1: ANALYSIS    ████████████████                                              │
│ ─ Literature Review  ██████████                                                    │
│ ─ Requirements       ████████████████                                              │
│ ─ Architecture       ████████████████                                              │
│                                                                                     │
│ PHASE 2: CONTRACTS            ████████████████████████                             │
│ ─ Core Contracts              ██████████████████                                   │
│ ─ Unit Testing                      ████████████████████                           │
│ ─ Testnet Deploy                          ████████████                             │
│                                                                                     │
│ PHASE 3: FRONTEND                         ████████████████████████                 │
│ ─ Setup & Layout                          ██████████                               │
│ ─ Web3 Integration                              ██████████████                     │
│ ─ UI Components                                       ████████████████             │
│ ─ IPFS/Graph                                                ██████████             │
│                                                                                     │
│ PHASE 4: TESTING                                            ████████████████       │
│ ─ E2E Testing                                               ████████               │
│ ─ Security Analysis                                         ██████████             │
│ ─ UAT                                                             ████████████     │
│                                                                                     │
│ PHASE 5: DOCUMENTATION                                                  ████████████
│ ─ Final Report                                                          ████████████
│ ─ Presentation                                                                ██████
│                                                                                     │
│ MILESTONES          ◆        ◆              ◆        ◆              ◆          ◆   │
│                     M1       M2             M3       M4             M5         M6  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

MILESTONES:
M1 (Week 4):  Architecture design complete, development environment ready
M2 (Week 7):  Core smart contracts implemented and tested locally
M3 (Week 10): Smart contracts deployed to testnet, basic frontend operational
M4 (Week 13): Full frontend complete with Web3 integration
M5 (Week 17): All testing complete, system ready for demonstration
M6 (Week 20): Final documentation and presentation complete
```

### 4.1.3 Detailed Task Breakdown

**Phase 1: Analysis and Design (Weeks 1-4)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| Literature review completion | 2 weeks | None |
| Stakeholder consultations | 1 week | None |
| Requirements documentation | 1 week | Literature review |
| Smart contract architecture | 2 weeks | Requirements |
| Frontend wireframes | 1 week | Requirements |
| Technical stack finalization | 1 week | Architecture |
| Development environment setup | 1 week | Stack finalization |

**Phase 2: Smart Contract Development (Weeks 5-10)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| AccessControl implementation | 1 week | Architecture |
| CylinderRegistry implementation | 2 weeks | AccessControl |
| VoucherManager implementation | 2 weeks | CylinderRegistry |
| CompanyManager implementation | 1 week | AccessControl |
| Unit test development | 3 weeks | Each contract |
| Security analysis | 1 week | All contracts |
| Testnet deployment | 1 week | Testing complete |

**Phase 3: Frontend Development (Weeks 8-13)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| Next.js project setup | 0.5 weeks | None |
| Layout and navigation | 1 week | Project setup |
| MetaMask integration | 1 week | Layout |
| Customer interface | 2 weeks | MetaMask |
| Staff interface | 2 weeks | MetaMask |
| Admin interface | 1.5 weeks | Staff interface |
| IPFS integration | 1 week | Interfaces |
| The Graph integration | 1 week | IPFS |

**Phase 4: Testing and Refinement (Weeks 14-17)**

| Task | Duration | Dependencies |
|------|----------|--------------|
| End-to-end testing | 2 weeks | All development |
| Performance optimization | 1 week | E2E testing |
| User acceptance testing | 2 weeks | Optimization |
| Bug fixes and refinements | 2 weeks | UAT |

## 4.2 Budget Estimation

### 4.2.1 Development Costs

Since this is an academic project developed by the student, development labor costs are not included. The budget focuses on infrastructure, tools, and operational costs.

### 4.2.2 Infrastructure Costs

| Item | Unit Cost | Quantity | Duration | Total Cost (USD) |
|------|-----------|----------|----------|------------------|
| Domain name (.com) | $12/year | 1 | 1 year | $12 |
| QuickNode RPC (Developer plan) | $49/month | 1 | 5 months | $245 |
| Pinata IPFS (Free tier) | $0/month | 1 | 5 months | $0 |
| The Graph (Hosted service) | $0/month | 1 | 5 months | $0 |
| Polygon MATIC for gas | $50 | 1 | - | $50 |
| SSL Certificate (Let's Encrypt) | $0 | 1 | - | $0 |
| **Subtotal Infrastructure** | | | | **$307** |

### 4.2.3 Software and Tools

| Item | Cost | Notes |
|------|------|-------|
| Visual Studio Code | $0 | Free, open source |
| Hardhat | $0 | Free, open source |
| MetaMask | $0 | Free browser extension |
| GitHub (Student account) | $0 | Free for students |
| Figma (Starter) | $0 | Free tier sufficient |
| **Subtotal Software** | **$0** | All open source or free tier |

### 4.2.4 Hardware

| Item | Cost | Notes |
|------|------|-------|
| Laptop (existing) | $0 | Using existing equipment |
| Smartphone for testing | $0 | Using existing device |
| **Subtotal Hardware** | **$0** | No additional hardware required |

### 4.2.5 Miscellaneous

| Item | Cost | Notes |
|------|------|-------|
| Transportation for observations | $30 | Visits to gas branches |
| Printing and documentation | $20 | Final report printing |
| Contingency (10%) | $35 | Unexpected expenses |
| **Subtotal Miscellaneous** | **$85** | |

### 4.2.6 Total Budget Summary

| Category | Amount (USD) |
|----------|--------------|
| Infrastructure | $307 |
| Software and Tools | $0 |
| Hardware | $0 |
| Miscellaneous | $85 |
| **TOTAL** | **$392** |

### 4.2.7 Budget Justification

The modest budget reflects the use of open-source tools and cloud services with generous free tiers. The primary cost is the QuickNode RPC service, which provides reliable blockchain connectivity essential for development and testing. The Polygon network was specifically chosen for its low transaction costs, with $50 in MATIC tokens sufficient for thousands of test transactions.

## 4.3 Feasibility Analysis

### 4.3.1 Technical Feasibility

**Technology Maturity:** All technologies used in this project are mature and well-documented. Solidity has been in production use since 2015, with millions of deployed contracts. React and Next.js are industry-standard frontend frameworks with extensive community support.

**Developer Skills:** The developer has completed coursework in web development, database systems, and has self-studied blockchain development through online courses and documentation. The project complexity is appropriate for the skill level with room for learning.

**Tool Availability:** All required tools are freely available or have affordable paid options within the project budget.

**Proof of Concept:** The existing CylinderSwapContract.sol in the repository demonstrates that the core smart contract logic is already functional, reducing technical risk.

**Assessment: HIGH FEASIBILITY** - The technical implementation is achievable with current technologies and skills.

### 4.3.2 Economic Feasibility

**Development Cost:** The total budget of $392 is within the typical range for student capstone projects and can be covered by the student or through available academic funding.

**Operational Cost:** Once deployed, the system's operational costs are minimal—primarily blockchain transaction fees (fractions of a cent on Polygon) and optional paid infrastructure upgrades.

**Value Proposition:** For gas companies, the potential savings from fraud reduction and automated reconciliation would quickly exceed implementation costs. A single prevented fraudulent voucher redemption (value approximately $15-50) could justify months of operational costs.

**Assessment: HIGH FEASIBILITY** - The project is economically viable for both development and operation.

### 4.3.3 Operational Feasibility

**User Acceptance:** Preliminary consultations suggest that branch staff are receptive to digital solutions that simplify their work. However, adoption will require training and change management beyond the scope of this project.

**Technical Literacy:** The target users have varying levels of technical literacy. The UI design prioritizes simplicity and familiarity, using QR codes (which users are already familiar with) rather than requiring direct blockchain interaction.

**Infrastructure:** Rwanda has good mobile network coverage and increasing smartphone penetration, supporting mobile-based blockchain interaction. However, reliable internet connectivity is required for transactions.

**Assessment: MODERATE FEASIBILITY** - Operational success depends on factors like user training and connectivity that are partially outside the project scope.

### 4.3.4 Schedule Feasibility

**Timeline Assessment:** The 20-week timeline is ambitious but achievable given:
- The modular architecture allows parallel development
- Core smart contract logic is already prototyped
- The developer can dedicate substantial time to the project

**Risk Factors:**
- Smart contract bugs may require extensive debugging
- Integration challenges between components
- User acceptance testing depends on participant availability

**Mitigation:** Buffer time is built into each phase, and the scope can be adjusted (e.g., simplifying admin features) if time becomes constrained.

**Assessment: MODERATE-HIGH FEASIBILITY** - Achievable with disciplined time management and willingness to adjust scope.

### 4.3.5 Legal and Regulatory Feasibility

**Cryptocurrency Regulations:** The project uses blockchain for record-keeping, not for payments or cryptocurrency trading. This reduces regulatory complexity as no financial services licenses are required.

**Data Protection:** The system minimizes personal data storage, and users consent to the public nature of blockchain records. GDPR-style data deletion requests cannot be fulfilled on-chain, but this is addressed through the pseudonymous nature of wallet addresses.

**Assessment: HIGH FEASIBILITY** - No significant legal barriers identified.

## 4.4 Expected Results and Outputs

### 4.4.1 Primary Outputs

**Smart Contracts (Solidity):**
- CylinderRegistry.sol - NFT-based cylinder tracking
- VoucherManager.sol - Voucher lifecycle management
- CompanyManager.sol - Company and branch registration
- AccessControl.sol - Role-based permissions
- Deployed and verified on Polygon Mumbai testnet

**Decentralized Application:**
- Customer interface for viewing and verifying vouchers
- Staff interface for creating and redeeming vouchers
- Admin interface for system configuration
- Responsive design for mobile and desktop
- MetaMask wallet integration

**Documentation:**
- Complete technical documentation
- User guides for each role
- API documentation for smart contracts
- Deployment and maintenance guide

### 4.4.2 Expected Performance Metrics

| Metric | Expected Value |
|--------|----------------|
| Voucher creation transaction time | < 5 seconds |
| Voucher creation gas cost | < $0.02 |
| Voucher verification time | < 2 seconds |
| Frontend load time | < 3 seconds |
| Smart contract test coverage | > 90% |
| Security vulnerabilities (critical) | 0 |

### 4.4.3 Expected Impact

**Immediate Impact (Prototype):**
- Demonstration of blockchain viability for LPG distribution
- Open-source codebase for further development
- Academic contribution to blockchain literature

**Potential Future Impact (Production Deployment):**
- Fraud reduction estimated at 80-95% compared to paper vouchers
- Reconciliation time reduction from days to seconds
- Foundation for cross-company interoperability
- Model for replication in other countries

## 4.5 Limitations and Mitigation Strategies

### 4.5.1 Technical Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Testnet-only deployment | Cannot process real transactions | Document deployment steps for mainnet |
| No IoT integration | Cannot automatically track cylinder location | Design architecture to accommodate future IoT |
| Single-company focus | Cannot demonstrate cross-company features | Document governance framework for multi-company |

### 4.5.2 Scope Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No mobile app | Users must use mobile web browser | Ensure responsive design works well on mobile |
| No payment integration | Does not handle financial transactions | Design interface for future payment integration |
| English-only interface | May limit adoption in Kinyarwanda-speaking areas | Use simple language, plan for i18n |

### 4.5.3 Research Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Small UAT sample | Limited generalizability of usability findings | Focus on qualitative insights rather than statistical conclusions |
| No long-term testing | Cannot assess system stability over time | Include monitoring in design for future testing |
| Simulated environment | May not reflect real-world conditions | Base scenarios on observed real-world processes |

---

# REFERENCES

Benet, J. (2014). IPFS - Content Addressed, Versioned, P2P File System. *arXiv preprint arXiv:1407.3561*.

Buterin, V. (2014). A Next-Generation Smart Contract and Decentralized Application Platform. *Ethereum Whitepaper*. Retrieved from https://ethereum.org/whitepaper

CATalytics. (2024). Cylinder Asset Tracking System and Analytics. Retrieved from https://www.catalytics.us/

Entriken, W., Shirley, D., Evans, J., & Sachs, N. (2018). EIP-721: Non-Fungible Token Standard. *Ethereum Improvement Proposals*. Retrieved from https://eips.ethereum.org/EIPS/eip-721

Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design Science in Information Systems Research. *MIS Quarterly*, 28(1), 75-105.

Hyperledger Foundation. (2020). IBM Food Trust: A New Era for the World's Food Supply. *Hyperledger Case Study*.

Kshetri, N. (2018). Blockchain's roles in meeting key supply chain management objectives. *International Journal of Information Management*, 39, 80-89.

Kshetri, N. (2022). Blockchain and supply chain management. In *The Economics of Blockchain* (pp. 119-138). Academic Press.

Ministry of Infrastructure Rwanda. (2024). Energy Sector Strategic Plan 2024-2029. Government of Rwanda.

Natarajan, H., Krause, S., & Gradstein, H. (2017). Distributed Ledger Technology and Blockchain. *World Bank FinTech Note*, 1.

Nugroho, H. S. (2025). Blockchain Implementation on Subsidised LPG Distribution in Gas Supply Chain (Case Study: Medan). *Journal of Information Systems Engineering*, 10(3), 245-260.

Polygon Technology. (2024). Polygon Documentation. Retrieved from https://docs.polygon.technology/

RURA - Rwanda Utilities Regulatory Authority. (2023). Annual Report on Energy Sector Performance. Kigali, Rwanda.

Saberi, S., Kouhizadeh, M., Sarkis, J., & Shen, L. (2019). Blockchain technology and its relationships to sustainable supply chain management. *International Journal of Production Research*, 57(7), 2117-2135.

Schmidt, C. G., & Wagner, S. M. (2019). Blockchain and supply chain relations: A transaction cost theory perspective. *Journal of Purchasing and Supply Management*, 25(4), 100552.

Tailored Blockchain Applications for the Natural Gas Industry: The Case Study of SOCAR. (2022). *Energies*, 15(16), 6010. MDPI.

The Graph Foundation. (2024). The Graph Documentation. Retrieved from https://thegraph.com/docs/

Xiao, W., Liu, C., Wang, H., Zhou, M., Hossain, M. S., Alrashoud, M., & Muhammad, G. (2021). Blockchain for Secure-GaS: Blockchain-Powered Secure Natural Gas IoT System with AI-Enabled Gas Prediction and Transaction in Smart City. *IEEE Internet of Things Journal*, 8(8), 6305-6312.

---

# APPENDICES

## Appendix A: Smart Contract Code Samples

### A.1 VoucherManager Core Functions

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VoucherManager is ERC721, AccessControl, ReentrancyGuard {
    bytes32 public constant BRANCH_STAFF_ROLE = keccak256("BRANCH_STAFF_ROLE");
    
    struct Voucher {
        uint256 cylinderTokenId;
        uint256 companyId;
        uint256 cylinderTypeId;
        uint256 sourceBranchId;
        address customer;
        uint256 createdAt;
        uint256 expiresAt;
        VoucherStatus status;
    }
    
    enum VoucherStatus { ACTIVE, REDEEMED, EXPIRED, CANCELLED }
    
    uint256 public constant VOUCHER_VALIDITY_DAYS = 30;
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => Voucher) public vouchers;
    
    event VoucherCreated(
        uint256 indexed voucherId,
        address indexed customer,
        uint256 cylinderTokenId,
        uint256 companyId,
        uint256 expiresAt
    );
    
    event VoucherRedeemed(
        uint256 indexed voucherId,
        address indexed customer,
        uint256 newCylinderTokenId,
        uint256 branchId
    );
    
    constructor() ERC721("GasSwapVoucher", "GSV") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function createVoucher(
        uint256 cylinderTokenId,
        uint256 companyId,
        uint256 cylinderTypeId,
        uint256 sourceBranchId,
        address customer
    ) external onlyRole(BRANCH_STAFF_ROLE) nonReentrant returns (uint256) {
        uint256 voucherId = _tokenIdCounter++;
        uint256 expiresAt = block.timestamp + (VOUCHER_VALIDITY_DAYS * 1 days);
        
        vouchers[voucherId] = Voucher({
            cylinderTokenId: cylinderTokenId,
            companyId: companyId,
            cylinderTypeId: cylinderTypeId,
            sourceBranchId: sourceBranchId,
            customer: customer,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: VoucherStatus.ACTIVE
        });
        
        _safeMint(customer, voucherId);
        
        emit VoucherCreated(voucherId, customer, cylinderTokenId, companyId, expiresAt);
        
        return voucherId;
    }
    
    function redeemVoucher(
        uint256 voucherId,
        uint256 destinationBranchId,
        uint256 newCylinderTokenId
    ) external onlyRole(BRANCH_STAFF_ROLE) nonReentrant {
        Voucher storage voucher = vouchers[voucherId];
        
        require(voucher.status == VoucherStatus.ACTIVE, "Voucher not active");
        require(block.timestamp <= voucher.expiresAt, "Voucher expired");
        
        voucher.status = VoucherStatus.REDEEMED;
        
        _burn(voucherId);
        
        emit VoucherRedeemed(
            voucherId, 
            voucher.customer, 
            newCylinderTokenId, 
            destinationBranchId
        );
    }
    
    function isVoucherValid(uint256 voucherId) external view returns (bool) {
        Voucher memory voucher = vouchers[voucherId];
        return voucher.status == VoucherStatus.ACTIVE && 
               block.timestamp <= voucher.expiresAt;
    }
    
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

## Appendix B: User Interface Wireframes

### B.1 Customer Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────┐                              🔗 0x7a3...4f2b  │
│  │  LOGO   │  Gas Cylinder Swap                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    YOUR VOUCHERS                         │   │
│   │                                                          │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│   │   │  VOUCHER 1  │  │  VOUCHER 2  │  │  + No more  │    │   │
│   │   │             │  │             │  │   vouchers  │    │   │
│   │   │ Kigaligas   │  │ Hash Gas    │  │             │    │   │
│   │   │ 12kg        │  │ 6kg         │  │             │    │   │
│   │   │             │  │             │  │             │    │   │
│   │   │ Expires:    │  │ Expires:    │  │             │    │   │
│   │   │ 2026-02-23  │  │ 2026-02-15  │  │             │    │   │
│   │   │             │  │             │  │             │    │   │
│   │   │ [View QR]   │  │ [View QR]   │  │             │    │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘    │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                 VERIFY A VOUCHER                        │   │
│   │                                                          │   │
│   │   Enter voucher ID: [____________________]  [Verify]    │   │
│   │                                                          │   │
│   │   Or scan QR code:  [📷 Open Camera]                    │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Appendix C: Data Dictionary

### C.1 Voucher Entity

| Field | Type | Description |
|-------|------|-------------|
| voucherId | uint256 | Unique identifier (NFT token ID) |
| cylinderTokenId | uint256 | Reference to deposited cylinder NFT |
| companyId | uint256 | Company that issued the voucher |
| cylinderTypeId | uint256 | Type of cylinder (6kg/12kg/15kg) |
| sourceBranchId | uint256 | Branch where cylinder was deposited |
| customer | address | Wallet address of customer |
| createdAt | uint256 | Unix timestamp of creation |
| expiresAt | uint256 | Unix timestamp of expiration |
| status | enum | ACTIVE, REDEEMED, EXPIRED, CANCELLED |

### C.2 Cylinder Entity

| Field | Type | Description |
|-------|------|-------------|
| tokenId | uint256 | Unique identifier (NFT token ID) |
| companyId | uint256 | Owning company |
| typeId | uint256 | Cylinder type |
| serialNumber | string | Physical serial number |
| branchId | uint256 | Current location |
| status | enum | IN_BRANCH, IN_TRANSIT, WITH_CUSTOMER, MAINTENANCE |
| manufacturingDate | uint256 | Manufacturing timestamp |
| lastInspection | uint256 | Last safety inspection timestamp |

---

**END OF CAPSTONE PROJECT BOOK**

---

*This document was prepared as part of the requirements for the Bachelor of Science in Information and Communication Technology. All code, diagrams, and analysis are original work unless otherwise cited.*
