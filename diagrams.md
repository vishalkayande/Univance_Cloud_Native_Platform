# UniVance – Comprehensive UML, DFD & Architecture Diagrams (Mermaid)

All diagrams are architected specifically for the **UniVance Cloud-Native Academic & Inter-Institutional Event Intelligence Platform** (React.js + Node.js/Express.js + MongoDB, orchestrated on AWS EKS). Each diagram is designed to fit cleanly on standard A4 documentation and adheres strictly to Mermaid syntax standards.

---

## 1. DFD Level 0 (Context Diagram)

The Level 0 Data Flow Diagram illustrates the foundational operational boundary of UniVance. It depicts external entities—Internal Students, External Inter-College Students, Department Organizers, Institutional Administrators, and External Micro-Services (Brevo SMTP & Cloud Storage)—interacting with the central UniVance platform.

```mermaid
flowchart LR
    S([Internal & Inter-College Students])
    O([Faculty & Department Organizers])
    A([Global Institutional Administrator])
    SYS((UniVance Academic &<br/>Inter-Institutional Event<br/>Intelligence Platform))
    MAIL([Brevo SMTP Service])
    REP([Accreditation Office /<br/>NAAC & NBA Audits])

    S -->|Onboarding, Credentials &<br/>Atomic Event Registrations| SYS
    SYS -->|Targeted Event Feeds,<br/>Live Leaderboards & Certificates| S

    O -->|Event Proposals, Department Scope,<br/>Attendance Rolls & Winners| SYS
    SYS -->|Moderation Status, Real-Time Rosters<br/>& Participant Analytics| O

    A -->|Approval, Rejection, User Sanctions<br/>& Two-Tier Modal Inspection| SYS
    SYS -->|Institutional Telemetry, Review Queues<br/>& Blocklist Records| A

    SYS -->|OTP Verification & Status Alerts| MAIL
    SYS -->|Multi-Tab Standardized Excel Rosters| REP
```

---

## 2. DFD Level 1 (High-Level System Decomposition)

The Level 1 DFD decomposes UniVance into five fundamental processing subsystems, illustrating the flow of data between user personas and persistent database stores.

```mermaid
flowchart TB
    subgraph Entities[External Entities]
        Student([Student])
        Organizer([Organizer])
        Admin([Campus Admin])
        EmailService([Brevo SMTP Engine])
    end

    subgraph Processes[Core Application Processes]
        P1((1.0 Authentication,<br/>IAM & Sanction Guard))
        P2((2.0 Logic-Gated<br/>Event Engine))
        P3((3.0 Atomic Enrollment<br/>& Team Management))
        P4((4.0 Admin Moderation<br/>& Two-Tier Telemetry))
        P5((5.0 Accreditation Reporting<br/>& Certificate Engine))
    end

    subgraph DataStores[MongoDB Persistent Collections]
        D1[(D1 Users & Sanctions)]
        D2[(D2 Events & Scopes)]
        D3[(D3 Registrations & Teams)]
        D4[(D4 Winners & Leaderboards)]
        D5[(D5 Certificates & Logs)]
    end

    Student -->|Signup with Roll No/Class & Login| P1
    Organizer -->|Signup with Dept & Login| P1
    Admin -->|Administrative Authentication| P1
    P1 -->|Dispatch OTP / Verification| EmailService
    P1 <-->|Read / Write Identity & Block Status| D1

    Organizer -->|Propose Event with Target Depts & Scope| P2
    P2 <-->|Store & Query Events| D2
    D1 -.->|Verify Organizer Affiliation| P2

    Student -->|Discover & Join Event| P3
    P3 <-->|Atomic Roster Mutation| D3
    D2 -.->|Verify Target Dept & Seat Balances| P3

    Admin -->|Approve/Reject & Block/Unblock| P4
    P4 <-->|Update Sanction & Review State| D1
    P4 <-->|Update Event Moderation State| D2

    Organizer -->|Declare Winners & Finalize Roster| P5
    Admin -->|Request Accreditation Roster (.xlsx)| P5
    P5 <-->|Store Winners & Certification Map| D4
    P5 <-->|Store Issued Digital Certificates| D5
    D3 -.->|Aggregate Participant Demographics| P5
```

---

## 3. DFD Level 2 (Decomposition of Process 2.0 & Process 4.0)

### 3.1 Process 2.0: Event Proposal & Logic-Gated Scoping

```mermaid
flowchart LR
    Organizer([Organizer])
    Student([Student])

    P21((2.1 Event Creation<br/>& Media Spec))
    P22((2.2 Dynamic Dept &<br/>Inter-College Scoping))
    P23((2.3 Moderation Queue<br/>Staging))
    P24((2.4 Context-Aware Feed<br/>Resolution Engine))

    D1[(D1 Users)]
    D2[(D2 Events)]

    Organizer -->|Input Title, Date, Venue, Capacity| P21
    P21 -->|Event Metadata| P22
    Organizer -->|Select Target Depts & Scope| P22
    P22 -->|Scoped Event Document| P23
    P23 -->|Save as Pending Approval| D2

    D2 -->|Approved Events| P24
    D1 -->|Student College, Dept & Class| P24
    P24 -->|Filtered Contextual Event Catalog| Student
```

---

### 3.2 Process 4.0: Administrative Moderation, Two-Tier Filtering & User Sanctions

```mermaid
flowchart TB
    Admin([Campus Administrator])

    P41((4.1 Review Queue<br/>Moderation))
    P42((4.2 Two-Tier Population<br/>Counter Engine))
    P43((4.3 Dynamic Modal Roster<br/>Dispatcher))
    P44((4.4 Sanction & Blocklist<br/>Controller))

    D1[(D1 Users)]
    D2[(D2 Events)]

    Admin -->|Approve / Reject Requests| P41
    P41 <-->|Mutate Approval Status| D2
    P41 <-->|Mutate Organizer Status| D1

    D1 -->|Active User Records| P42
    D2 -->|Active Event Records| P42
    P42 -->|Compute Counts: Dept, Class & Category| P43
    Admin -->|Click Distribution Button e.g. CSE-04| P43
    P43 -->|Render Dedicated High-Speed Modal Roster| Admin

    Admin -->|Issue Ban / Block Action| P44
    P44 -->|Set isBlocked: true & blockReason| D1
    Admin -->|Issue Unblock Action| P44
    P44 -->|Set isBlocked: false & Restore Data| D1
```

---

## 4. Use Case Diagram

The Use Case Diagram models interactions across all three primary system actors (**Student**, **Organizer**, and **Administrator**) and external integration engines, highlighting the new functional capabilities introduced in UniVance Phase 1.

```mermaid
flowchart LR
    Student([Student])
    Organizer([Faculty / Club Organizer])
    Admin([Global Campus Administrator])

    subgraph UniVance["UniVance Platform Scope"]
        UC1([Register & Authenticate via DIEMS/College Registry])
        UC2([Browse Context-Aware Logic-Gated Events])
        UC3([Atomic Event Enrollment & Team Creation])
        UC4([View Personal Achievement Dossier & Certificates])
        UC5([View Real-Time Event Leaderboards])

        UC6([Propose Event with Target Depts & Level])
        UC7([Manage Event Rosters & Live Capacity])
        UC8([Declare Event Winners & Finalize Rankings])
        UC9([Generate & Issue Digital Certificates])

        UC10([Moderate Event Proposals in Review Queue])
        UC11([Inspect Campus via Two-Tier Filter Panels])
        UC12([Access Detailed Student/Organizer Modal Rosters])
        UC13([Execute Administrative Sanctions: Block / Unblock])
        UC14([Manage Campus Blocklist & Inspect Violation Reasons])
        UC15([Export Accreditation-Compliant Multi-Tab Excel])
    end

    Student --- UC1
    Student --- UC2
    Student --- UC3
    Student --- UC4
    Student --- UC5

    Organizer --- UC1
    Organizer --- UC6
    Organizer --- UC7
    Organizer --- UC8
    Organizer --- UC9
    Organizer --- UC15

    Admin --- UC1
    Admin --- UC10
    Admin --- UC11
    Admin --- UC12
    Admin --- UC13
    Admin --- UC14
    Admin --- UC15
```

---

## 5. Class Diagram (Model Architecture)

The Class Diagram reflects the underlying Mongoose object schemas, encapsulating student credentials, dynamic target departments, inter-college scoping, two-tier distribution structures, and administrative sanction flags.

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +String role
        +String collegeName
        +Boolean isApproved
        +Boolean isBlocked
        +String blockReason
        +Date createdAt
        +matchPassword(enteredPassword) Boolean
    }

    class StudentDetails {
        +String rollNo
        +String class
        +String branch
        +String year
        +String mobileNo
    }

    class OrganizerDetails {
        +String department
        +String mobileNo
        +String contactEmail
    }

    class Event {
        +ObjectId _id
        +ObjectId organizer
        +String name
        +String college
        +String level
        +List~String~ targetDepartments
        +String category
        +String description
        +Date date
        +String time
        +String venue
        +int maxParticipants
        +Boolean isGroupEvent
        +int minTeamSize
        +int maxTeamSize
        +String status
        +Boolean isApproved
        +Boolean isPaused
        +CertificateTemplate certificateTemplate
        +List~Registration~ registrations
        +List~Winner~ winners
    }

    class CertificateTemplate {
        +String title
        +String issuedBy
        +String signatureUrl
        +String backgroundUrl
    }

    class Registration {
        +ObjectId _id
        +ObjectId student
        +String teamName
        +ObjectId teamLeader
        +List~ObjectId~ teamMembers
        +Date registeredAt
    }

    class Winner {
        +ObjectId _id
        +ObjectId student
        +String name
        +String teamName
        +int position
        +String prize
    }

    User "1" *-- "0..1" StudentDetails : embeds
    User "1" *-- "0..1" OrganizerDetails : embeds
    User "1" --> "*" Event : proposes / manages
    Event "1" *-- "1" CertificateTemplate : configures
    Event "1" *-- "*" Registration : contains
    Event "1" *-- "*" Winner : declares
    Registration "*" --> "1" User : student reference
    Winner "*" --> "1" User : recipient reference
```

---

## 6. Sequence Diagrams

### 6.1 Event Lifecycle with Dynamic Department & Inter-College Resolution

```mermaid
sequenceDiagram
    autonumber
    actor Org as Organizer
    actor Admin as Administrator
    actor Stud as Student
    participant Client as Frontend (Vite/React)
    participant API as Express API Controller
    participant Guard as Auth & Scope Guard
    participant DB as MongoDB Atlas / Pod

    Note over Org,DB: 1. Event Proposal & Scope Configuration
    Org->>Client: Submit event form (Target Depts: ['CSE', 'AIML'], Level: 'Intercollege')
    Client->>API: POST /api/events (Bearer JWT)
    API->>Guard: Validate JWT & role == 'organizer'
    Guard-->>API: Authorized
    API->>DB: Save Event document (status: 'pending', isApproved: false)
    DB-->>API: Document created
    API-->>Client: 201 Created (Staged in Moderation Queue)

    Note over Admin,DB: 2. Administrative Vetting & Publication
    Admin->>Client: Open Review Queue
    Client->>API: GET /api/admin/dashboard
    API->>DB: Fetch pending events & pending accounts
    DB-->>API: Pending records
    API-->>Client: Render Review Queue
    Admin->>Client: Click "Approve & Publish"
    Client->>API: PUT /api/admin/approve-event/:id
    API->>DB: Update event status: 'approved', isApproved: true
    DB-->>API: Mutation acknowledged
    API-->>Client: 200 OK (Event Live)

    Note over Stud,DB: 3. Logic-Gated Contextual Discovery & Atomic Enrollment
    Stud->>Client: Browse live events catalog
    Client->>API: GET /api/events (Bearer JWT)
    API->>Guard: Resolve student college & dept
    API->>DB: Query events matching logic gate: Level == 'Intercollege' OR Dept IN targetDepartments
    DB-->>API: Accessible events list
    API-->>Client: Render contextual event cards
    Stud->>Client: Click "Register Event"
    Client->>API: POST /api/events/:id/enroll
    API->>DB: Atomic mutation $addToSet: { registrations: studentId }
    DB-->>API: Mutation verified
    API-->>Client: 200 OK (Registration Confirmed)
    Client-->>Stud: Display Confirmation & Calendar Entry
```

---

### 6.2 Administrative Sanctions: Account Blocking & Non-Destructive Restoration

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    actor Stud as Student
    participant Client as Frontend UI
    participant API as Admin Controller
    participant Auth as Auth Middleware
    participant DB as MongoDB

    Note over Admin,DB: 1. Administrative Account Sanction (Blocking)
    Admin->>Client: Click "Block User" from Directory / Approval Queue
    Client->>Admin: Prompt for Sanction Reason
    Admin-->>Client: "Misconduct in campus lab"
    Client->>API: PUT /api/admin/block-user/:id { reason }
    API->>DB: Update User: isBlocked = true, blockReason = reason
    DB-->>API: Updated
    API-->>Client: 200 OK (User moved to Blocklist)

    Note over Stud,DB: 2. Blocked User Access Rejection
    Stud->>Client: Attempt Login or API Request
    Client->>API: POST /api/users/login OR Authenticated Route
    API->>Auth: Check user.isBlocked
    Auth-->>API: isBlocked == true
    API-->>Client: 403 Forbidden: "Account restricted by administrator"
    Client-->>Stud: Display Dedicated Banned Screen with Contact Info

    Note over Admin,DB: 3. Non-Destructive Account Restoration (Unblocking)
    Admin->>Client: Open Blocklist Tab -> Click "Unblock Student"
    Client->>API: PUT /api/admin/unblock-user/:id
    API->>DB: Update User: isBlocked = false, isApproved = true, blockReason = ''
    DB-->>API: Restored
    API-->>Client: 200 OK (Account Restored)
    Note over Stud,DB: Student can log in immediately; all past registrations & certificates remain 100% intact
```

---

## 7. Activity Diagram (Dynamic Event Lifecycle & Department Gating)

The Activity Diagram models the decision logic governing event creation, administrative review, target department evaluation, and student enrollment verification.

```mermaid
flowchart TD
    Start([Organizer logs in]) --> Create[Fill Event Form]
    Create --> Scoping[Select Scope: Level & Target Departments]
    Scoping --> Submit[Submit Event Proposal]
    Submit --> Queue[Event enters Administrative Review Queue]
    Queue --> AdminReview{Admin Decision?}

    AdminReview -->|Reject| Rejected[Event Rejected & Archived]
    Rejected --> EndState([Process Terminated])

    AdminReview -->|Approve| Live[Event Approved & Published]
    Live --> StudentBrowsing[Student accesses Event Feed]

    StudentBrowsing --> CheckCollege{Is Event Intercollege?}
    CheckCollege -->|Yes| CheckSeats{Seats Available?}
    CheckCollege -->|No| CheckSameCollege{Same College?}

    CheckSameCollege -->|No| Ineligible[Event Hidden / Access Denied]
    Ineligible --> EndState

    CheckSameCollege -->|Yes| CheckDeptScope{Target Depts Specified?}
    CheckDeptScope -->|No - Open to All| CheckSeats
    CheckDeptScope -->|Yes| CheckStudentDept{Student Dept in Target List?}

    CheckStudentDept -->|No| Ineligible
    CheckStudentDept -->|Yes| CheckSeats

    CheckSeats -->|Full| CapacityFull[Display Registration Full]
    CapacityFull --> EndState

    CheckSeats -->|Available| Enroll[Atomic Registration via $addToSet]
    Enroll --> Enrolled([Enrollment Successful & Roster Updated])
```

---

## 8. State Chart Diagrams

### 8.1 Event State Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft : Organizer drafts event
    Draft --> PendingApproval : Organizer submits proposal
    PendingApproval --> Approved : Admin approves
    PendingApproval --> Rejected : Admin rejects
    Rejected --> [*]

    Approved --> ActiveLive : Event date starts
    Approved --> Paused : Organizer/Admin pauses event
    ActiveLive --> Paused : Capacity/Logistics hold
    Paused --> ActiveLive : Resume registration

    ActiveLive --> Closed : Deadline passes / Max seats reached
    Closed --> ResultsDeclared : Organizer declares winners
    ResultsDeclared --> Certified : Certificates generated & distributed
    Certified --> [*]
```

---

### 8.2 User Account & Sanction Lifecycle (Finite State Machine)

```mermaid
stateDiagram-v2
    [*] --> RegisteredPending : User signs up (Student / Organizer)
    RegisteredPending --> ActiveApproved : Admin approves account
    RegisteredPending --> Blocked : Admin blocks from Review Queue
    RegisteredPending --> Terminated : Admin deletes account

    ActiveApproved --> Blocked : Admin blocks active user (Sanction)
    Blocked --> ActiveApproved : Admin unblocks user (Full Data Restored)

    ActiveApproved --> Terminated : Admin permanently deletes user
    Blocked --> Terminated : Admin permanently deletes user
    Terminated --> [*]
```

---

## 9. Component Diagram (Micro-Orchestrated System Architecture)

The Component Diagram models UniVance's internal software modularity and communication protocols within the containerized runtime.

```mermaid
flowchart TB
    subgraph ClientTier["Client Tier (Browser / Mobile)"]
        UI["React.js Single-Page Application (Vite Bundled)"]
        State["Zustand / Context State Engine"]
        AxiosClient["Axios HTTP Client (JWT Interceptor)"]
        SocketClient["Socket.io WebSocket Client"]
    end

    subgraph GatewayTier["Ingress & Edge Routing"]
        ALB["AWS Application Load Balancer"]
        Ingress["Kubernetes Nginx Ingress Controller"]
    end

    subgraph ServiceTier["Express.js Microservices Layer"]
        AuthSvc["Authentication & IAM Service (Bcrypt + JWT)"]
        SanctionGuard["Sanction Guard Middleware (Blocklist Gate)"]
        EventSvc["Event Lifecycle & Logic Gating Engine"]
        AdminSvc["Admin Telemetry & Two-Tier Roster Controller"]
        ReportSvc["Excel Portability Engine (SheetJS / xlsx)"]
        CertSvc["Dynamic Coordinate Certificate Generator"]
        SocketSvc["Socket.io Real-Time Synchronization Gateway"]
    end

    subgraph PersistenceTier["Data & External Services Tier"]
        MongoStateful["MongoDB StatefulSet (AWS EBS gp3 Volume)"]
        BrevoSMTP["Brevo SMTP Service (Transactional Mail)"]
    end

    UI --> State
    State --> AxiosClient
    State --> SocketClient

    AxiosClient -->|HTTPS REST| ALB
    SocketClient -->|WSS WebSockets| ALB

    ALB --> Ingress
    Ingress --> AuthSvc
    Ingress --> EventSvc
    Ingress --> AdminSvc
    Ingress --> ReportSvc
    Ingress --> CertSvc
    Ingress --> SocketSvc

    AuthSvc --> SanctionGuard
    EventSvc --> SanctionGuard
    AdminSvc --> SanctionGuard

    SanctionGuard --> MongoStateful
    EventSvc --> MongoStateful
    AdminSvc --> MongoStateful
    ReportSvc --> MongoStateful
    CertSvc --> MongoStateful

    AuthSvc -.->|Trigger OTP / Mail| BrevoSMTP
```

---

## 10. Deployment Diagram (AWS EKS Cloud-Native Cluster Topology)

The Deployment Diagram details the multi-availability-zone infrastructure on Amazon Web Services, illustrating Kubernetes Pod placements, Auto Scaling Groups, persistent storage claims, and load-balancer routing.

```mermaid
flowchart TB
    Internet([Public Internet Client]) -->|HTTPS:443| Route53[Amazon Route 53 DNS]
    Route53 --> ALB[AWS Application Load Balancer]

    subgraph AWS_VPC["AWS Virtual Private Cloud (VPC) - Region: ap-south-1"]
        ALB -->|Forward Traffic| K8s_Ingress[Kubernetes Nginx Ingress Controller]

        subgraph PublicSubnets["Public Subnets (Multi-AZ)"]
            NAT[AWS NAT Gateway]
        end

        subgraph PrivateSubnets["Private Subnets (EKS Managed Worker Nodes)"]
            subgraph NodeGroup["AWS EC2 Auto Scaling Node Group (t3.medium)"]
                subgraph Pod_Frontend["Frontend Pods (Multi-Replica)"]
                    NginxApp["Nginx Alpine Container (React Compiled SPA)"]
                end

                subgraph Pod_Backend["Backend Pods (HPA Scaled Replicas)"]
                    NodeApp["Node.js Express API Container"]
                end

                subgraph Pod_Database["Database Pod (StatefulSet)"]
                    MongoDB["MongoDB 7.0 Container"]
                end
            end

            EBS_PVC[(AWS EBS gp3 Volume Claim<br/>3000 IOPS Persistent Storage)]
        end

        subgraph CloudRegistry["Container Registry"]
            ECR[AWS Elastic Container Registry - ECR]
        end
    end

    K8s_Ingress -->|Route Client Requests| Pod_Frontend
    K8s_Ingress -->|Route /api & /socket.io| Pod_Backend
    Pod_Frontend -.->|API Proxy Calls| Pod_Backend
    Pod_Backend <-->|TCP:27017 Authenticated Connection| Pod_Database
    Pod_Database <-->|CSI Driver Volume Mount| EBS_PVC

    ECR -.->|Pull Images on Deployment| NodeGroup
    Pod_Backend -->|Outbound Email via NAT| NAT
    NAT -->|SMTP Traffic| ExternalMail([Brevo SMTP External Server])
```

---

## 11. Entity Relationship (ER) Diagram

The Entity Relationship diagram visualizes database schema associations, foreign key references, and multi-college document embeds.

```mermaid
erDiagram
    COLLEGE ||--o{ USER : enrolls_or_employs
    COLLEGE ||--o{ EVENT : hosts
    USER ||--o{ EVENT : organizes
    USER ||--o{ REGISTRATION : submits
    EVENT ||--o{ REGISTRATION : receives
    EVENT ||--o{ WINNER : awards
    USER ||--o{ WINNER : receives_award

    COLLEGE {
        ObjectId _id PK
        String name
        String code
        String address
        Boolean isDefaultAnchor
    }

    USER {
        ObjectId _id PK
        String name
        String email UK
        String password
        String role
        String collegeName
        Boolean isApproved
        Boolean isBlocked
        String blockReason
        Date createdAt
        String student_rollNo
        String student_class
        String student_branch
        String student_year
        String student_mobileNo
        String organizer_department
        String organizer_mobileNo
    }

    EVENT {
        ObjectId _id PK
        ObjectId organizer FK
        String name
        String college
        String level
        Array targetDepartments
        String category
        String description
        Date date
        String time
        String venue
        int maxParticipants
        Boolean isGroupEvent
        int minTeamSize
        int maxTeamSize
        String status
        Boolean isApproved
        Boolean isPaused
        String cert_title
        String cert_issuedBy
        String cert_signatureUrl
    }

    REGISTRATION {
        ObjectId _id PK
        ObjectId event FK
        ObjectId student FK
        String teamName
        ObjectId teamLeader FK
        Array teamMembers
        Date registeredAt
    }

    WINNER {
        ObjectId _id PK
        ObjectId event FK
        ObjectId student FK
        String name
        String teamName
        int position
        String prize
    }
```
