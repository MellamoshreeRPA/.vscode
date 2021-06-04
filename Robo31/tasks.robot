*** Settings ***
Documentation   Template robot main suite.
Library         RPA.Browser
Library         RPA.Excel.Files
Library         RPA.Tables
Library         RPA.FileSystem
Library         RPA.PDF
Library         RPA.Dialogs
Library         RPA.Archive
Library         Screenshot
Library         Collections
Library         OperatingSystem
Library         RPA.Robocloud.Secrets


*** Keyword***
Open_Browser_and_Maximise
    Log      OPening Browser...
    Get and log the value of the vault secrets using the Get Secret keyword & visit website
    Maximize Browser Window
    Wait And Click Button    xpath://button[contains(text(),'OK')]

Read_the_Excel_worksheet_data_by_opening_workbook
   # @{table}=    Read table from CSV    ${OUTPUT_DIR}\\orders.csv   header=True
    @{table}=    Read table from CSV    ${excel_file_path}   header=True
    Log   This is tables:Found columns: @{table}
    Set Global Variable    @{table}
    
Read_the_tabel_and_apply_For_loop
    
    FOR     ${Li}    IN      ${table}
        Log    This is value of Li now-
        Log           ${Li}
        Set Global Variable    ${Li}
    END
    
Fill_and_submit
    
   # Input Text When Element Is Visible    {Loc_Address}      ${i}[0][Address]           
   Log    Itertaing every list item to find out Address...
   FOR    ${D}    IN    ${Li}
       FOR    ${D2}    IN    @{D}
               Log    ${D2}[Order number]
               Log    ${D2}[Head]
               Sleep    1s
               Set Selenium Speed    0.25 seconds
               Select From List By Value    xpath://select[@id='head']        ${D2}[Head]
               Log    ${D2}[Body]
               Click Element When Visible    xpath://input[@id='id-body-${D2}[Body]']
               Log    ${D2}[Legs]
               Input Text When Element Is Visible    xpath://input[@placeholder='Enter the part number for the legs']        ${D2}[Legs] 
               Log    ${D2}[Address]
               Input Text When Element Is Visible    xpath://input[@id='address']    ${D2}[Address]
               Click Button When Visible    xpath://button[@id='preview']
               #Click Button When Visible    xpath://button[@id='order']
               Wait Until Keyword Succeeds    3 min    3 sec    Click_On_Order_Button    
               Click Element If Visible    xpath://button[@id='order']               
               Click Element If Visible    xpath://button[@id='order']
               Click Element If Visible    xpath://button[@id='order']
               Wait Until Keyword Succeeds   1 min    3 sec    Wait Until Page Contains    Receipt    0.5s
               #just added above line

               Create Directory    ${OUTPUT_DIR}\\Screenshots
               Capture Element Screenshot    xpath://div[@id='receipt']        ${OUTPUT_DIR}\\Screenshots\\Receipt-${D2}[Order number].png
               Append To List    ${files}    ${OUTPUT_DIR}\\Screenshots\\Receipt-${D2}[Order number].png
               
               Capture Element Screenshot    xpath://div[@id='robot-preview-image']        ${OUTPUT_DIR}\\Screenshots\\RobotImage-${D2}[Order number].png
               Append To List    ${files}    ${OUTPUT_DIR}\\Screenshots\\RobotImage-${D2}[Order number].png
               Log List    ${files}
               Create Directory    ${OUTPUT_DIR}\\pdf  
               Add Files To Pdf    ${files}        ${OUTPUT_DIR}\\pdf\\${D2}[Order number].pdf 
               Remove From List    ${files}    0
               Remove From List    ${files}    0
               Click Button When Visible    xpath://button[@id='order-another']
               Wait And Click Button    xpath://button[contains(text(),'OK')]  
       END
          
   END 

Enter_the_data
    Log    For Head
    Select From List By Value    xpath://select[@id='head']        ${D2}[Head]
    Log    For Body
    Click Element When Visible    xpath://input[@id='id-body-${D2}[Body]']
    Log    For Legs
    Input Text When Element Is Visible    xpath://input[@placeholder='Enter the part number for the legs']        ${D2}[Legs] 
    Log    For Address
    Input Text When Element Is Visible    xpath://input[@id='address']    ${D2}[Address]

Click_On_Order_Button
    Click Element If Visible    xpath://button[@id='order']

Create_List_to_store_img
     ${files}=    Create List
     Set Global Variable    ${files}
     

Append_To_List_All_images_Captured
    Append To List    ${files}    Receipt-${D2}[Order number].PNG   

Saving_Screenshot_In_PDF
    Add Files To Pdf    ${files}        ${D2}[Order number].pdf


Create_a_ZIP_File
    Create Directory    ${OUTPUT_DIR}\\Here_is_ZIP_Result
    Archive Folder With zip    ${OUTPUT_DIR}\\pdf        ${OUTPUT_DIR}\\Here_is_ZIP_Result\\mydocs.zip

Collect csv File From User
    Add heading    Upload csv File
    Add file input
    ...    label=Upload the Excel file with sales data
    ...    name=fileupload
    ...    file_type=csv files (*.csv)
    ...    destination=${CURDIR}${/}output
    ${response}=    Run dialog
    [Return]    ${response.fileupload}[0] 


Get and log the value of the vault secrets using the Get Secret keyword & visit website
    ${secret}=    Get Secret    VaultOne
    # Note: in real robots, you should not print secrets to the log. this is just for demonstration purposes :)
    Log    ${secret}[Website_URL]
    Open Available Browser     ${secret}[Website_URL]

        

*** Tasks ***
Minimal task
    Log  This is logging here
    Open_Browser_and_Maximise
    ${excel_file_path}=    Collect csv File From User
    Set Global Variable    ${excel_file_path}    
    Read_the_Excel_worksheet_data_by_opening_workbook
    Read_the_tabel_and_apply_For_loop
    Create_List_to_store_img
    Fill_and_submit
    Create_a_ZIP_File
    Log    WooHoo!! Newly Create zip file is at location: ${OUTPUT_DIR}\\
   
