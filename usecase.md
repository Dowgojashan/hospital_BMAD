```mermaid
graph TD
    %% Define Actors
    actor P[病患]
    actor D[醫生]
    actor A[管理員]

    %% Define Subgraphs (Modules)
    subgraph 1.0 使用者與身分管理
        UC1_1[1.1 病患註冊]
        UC1_2[1.2 帳號建立/管理]
        UC1_3[1.3 帳號修改/刪除]
        UC1_4[1.4 使用者登入/登出]
        UC1_5[1.5 修改個人資料]
    end

    subgraph 2.0 門診與班表管理
        UC2_1[2.1 班表新增/修改/刪除]
        UC2_2[2.2 醫生停診申請/審核]
        UC2_3[2.3 醫生查看個人班表]
        UC2_4[2.4 查詢醫生班表]
    end

    subgraph 3.0 線上掛號與預約
        UC3_1[3.1 新增掛號]
        UC3_2[3.2 修改/刪除掛號]
        UC3_3[3.3 查詢掛號記錄]
        UC3_4[3.4 候補管理]
        UC3_5[3.5 過號/爽約懲罰]
    end

    subgraph 4.0 到診報到與候診排隊
        UC4_1[4.1 病患線上/現場報到]
        UC4_2[4.2 即時看診資訊顯示]
    end

    subgraph 5.0 病歷資料管理
        UC5_1[5.1 歷史病歷查詢]
        UC5_2[5.2 醫生新增/修改/刪除病歷]
        UC5_3[5.3 審計日誌檢視]
        UC5_4[5.4 存取控管（RBAC）]
    end

    subgraph 6.0 診務通知與管理儀表板
        UC6_1[6.1 服務通知發送]
        UC6_2[6.2 門診流量儀表板]
        UC6_3[6.3 看診提醒通知]
    end

    %% Define Relationships (Actor to Use Case)

    %% P (病患)
    P --> UC1_1;
    P --> UC1_4;
    P --> UC1_5;
    P --> UC2_4;
    P --> UC3_1;
    P --> UC3_2;
    P --> UC3_3;
    P --> UC3_4;
    P --> UC4_1;
    P --> UC4_2;
    P --> UC5_1;
    P --> UC6_3;

    %% D (醫生)
    D --> UC1_4;
    D --> UC1_5;
    D --> UC2_2;
    D --> UC2_3;
    D --> UC5_1;
    D --> UC5_2;

    %% A (管理員)
    A --> UC1_2;
    A --> UC1_3;
    A --> UC1_4;
    A --> UC1_5;
    A --> UC2_1;
    A --> UC2_2;
    A --> UC2_4;
    A --> UC3_5;
    A --> UC4_1;
    A --> UC5_3;
    A --> UC5_4;
    A --> UC6_1;
    A --> UC6_2;

    %% Include/Extend Relationships (Internal Logic)
    UC1_4 .> UC1_5 : extends
    UC2_1 .> UC2_4 : includes
    UC4_1 .> UC4_2 : includes
    UC3_1 .> UC3_4 : includes
    UC3_5 .> UC4_1 : extends
    UC2_2 .> UC6_1 : includes