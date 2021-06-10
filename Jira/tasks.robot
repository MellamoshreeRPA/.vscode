*** Settings ***
Documentation   Template robot main suite.
Library         RPA.Browser
Library         RPA.Tables
Library         Collections
Library         DateTime
Library         String
Library         RPA.FileSystem
Variables       C:\\Users\\Shriraj.Joshi\\.vscode\\Jira\\variable.py


*** Keyword***
Open_Browser_and_login_to_zbrt
    Log      OPening Browser..
    Open Available Browser    url=${zbrt_URL}
    Maximize Browser Window
    Input Text    ${Username}    v-asingh
    Input Password    ${pwd}    emtec@999
    Click Button    ${Login_button}

Read_the_CSV_DATA
    @{table}=    Read table from CSV    ${OUTPUT_DIR}\\Jira\\pass.csv   header=True
    Log   This is tables:Found columns: @{table}
    Set Global Variable    @{table}
    
Create_List_of_plans
    #For adding plan in one list
    @{plan_list}=    Create List
    FOR    ${Li}    IN    @{table}
        Log    This issss Plan: ${Li}[PlanName]
        
        Append To List    ${plan_list}    ${Li}[PlanName]
        
    END
    Log    ${plan_list}                         #This is list of plans 
    Set Global Variable    ${plan_list}

    #Uncommentic this v

    #THis below code actually calling a keyword which is creating the plans for all item in loop.
    FOR    ${p}    IN    @{plan_list}
        Log    ${p}
        Set Global Variable    ${p}
        Run Keyword    Go_to_plan_page_&_make_plans     
    END

    #Uncommenting this  ^   

    log     ${Counter} #This should be now zero
    
    Set Global Variable    ${maxx}       #Initializing variable

    ${maxx}=     Get Length    ${plan_list}    #This ishould be the numebr of plans made
    log     ${maxx}    #Till this number counter need to increase
    
   

    FOR    ${element}    IN     @{plan_list}
        Log    ${element}
        Run Keyword    Create_list_of_cycles
        ${Counter}=    Evaluate    ${Counter}+ ${1}
        Log    ${Counter}
        Set Global Variable    ${Counter}       #Initializing variable
    END

Go_to_plan_page_&_make_plans
    Sleep    10 seconds
    Set Selenium Speed    1.5 seconds
    #Click Button When Visible    ${New_Plan_Button}
    Go To    ${Plan_URL_SXP_Direct}
    Input Text When Element Is Visible    ${PlanNameLocator}    ${p}
    Click Button    ${Draft_First_click}
    Click Element When Visible    ${Draft_Second_click_Approved}
    Click Button    ${Save_Plan}


Create_list_of_cycles
    #For 4 cycles and adding it to a list
    @{cycle_list}=    Create List

    Log    ${Counter}
    Log     This is test counter

    Set Global Variable    ${t_cycle_Name}     ${plan_list}[${Counter}]-Win10chrome
    Log    ${t_cycle_Name}
    Append To List    ${cycle_list}       ${t_cycle_Name} 
    #Here to put actual cycle creation keyword below line
    Run Keyword    Go_to_cycle_page_to_create
    Set Suite Variable	${t_cycle_Name}	    ${EMPTY}


    Set Global Variable    ${t_cycle_Name}     ${plan_list}[${Counter}]-iPhone
    Log    ${t_cycle_Name}
    Append To List    ${cycle_list}       ${t_cycle_Name}
    #Here to put actual cycle creation keyword below line
    Run Keyword    Go_to_cycle_page_to_create
    Set Suite Variable	${t_cycle_Name}	    ${EMPTY}

    Set Global Variable    ${t_cycle_Name}     ${plan_list}[${Counter}]-Android
    Log    ${t_cycle_Name}
    Append To List    ${cycle_list}       ${t_cycle_Name}
    #Here to put actual cycle creation keyword below line
    Run Keyword    Go_to_cycle_page_to_create
    Set Suite Variable	${t_cycle_Name}	    ${EMPTY}

    Set Global Variable    ${t_cycle_Name}     ${plan_list}[${Counter}]-iPad
    Log    ${t_cycle_Name}
    Append To List    ${cycle_list}       ${t_cycle_Name}
    #Here to put actual cycle creation keyword below line
    Run Keyword    Go_to_cycle_page_to_create
    Set Suite Variable	${t_cycle_Name}	    ${EMPTY}

    Log    THis is counter cycle list...
    Log    ${cycle_list}             #THis is counter cycle list...

    Log     This below line shoud be empty
    Log    ${t_cycle_Name} 
    Log     Wohoooo
    
   

Go_to_cycle_page_to_create
    Sleep    8 seconds
    Set Selenium Speed    1.5 seconds
#    #Click Button When Visible    ${Test_Button_On_Top_Nav}
#    #Click Button When Visible    ${Drop_Down}
#   #Click Button When Visible    ${Select_from_DD_SXP}
    Go To    ${Test_Cycle_URL_With_FOR_SXP}
  # Click Button When Visible    ${New_Button}
    Go To    ${New_Cycle_Direct_URL}
    Input Text When Element Is Visible    ${Name}    ${t_cycle_Name}
    Press Keys    ${Name}    SHIFT+TAB    SHIFT+TAB    SHIFT+TAB    SHIFT+TAB    SHIFT+TAB    ENTER
   ##
    Click Button When Visible    ${Add_test_Case_button}
    Sleep    3 seconds
    Click Element When Visible    ${Filter_arrow}
    Sleep    1.5 seconds
    Click Element When Visible    ${DD_for_FTD_OR_Slowboat_Selection}
    #Here to write code for FTD / Slowboat selection
    
    
    #Click Element When Visible    ${SlowBoat_selection}
    
    @{FTD}=    Create List    FTD
    ${matches}=	Get Regexp Matches	${plan_list}[0]     FTD+
    Log     ${matches}
    IF    ${matches} == ${FTD}
        Click Element When Visible    ${FTD_SELCTION}
    ELSE
        Click Element When Visible    ${SlowBoat_selection}
    END

    #Click Element When Visible    ${FTD_SELCTION}
    

    # Here to write code for FTD / Slowboat selection endsss...^

    Click Element When Visible    ${Filter_arrow}    
    Press Keys    ${Filter_arrow}    SHIFT+TAB    SHIFT+TAB    SPACE
    Click Element When Visible    ${Filter_arrow}  
   #Click Element When Visible    ${Checkbox_all_selection}
    Click Button When Visible    ${Add_button}
    Click Element When Visible    ${Tracebility}
    Click Element When Visible    ${find_testplan_icon}
    Input Text When Element Is Visible    ${testplan_nameForLinking}        ${plan_list}[${Counter}]
    Press Keys    ${testplan_nameForLinking}    ENTER    
 
    Click Element When Visible    ${CheckBox_PlanLink}
    Click Element When Visible    ${Add_ButtonForLinkTP}
    Click Element When Visible    ${Save_ButtonOfCycle}


*** Tasks ***
Minimal task
    Open_Browser_and_login_to_zbrt
    Read_the_CSV_DATA
    Create_List_of_plans
    
    #Create_list_of_cycles
    #Go_to_cycle_page_to_create


