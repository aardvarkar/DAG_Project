
import os
import csv
import json

### Defined the path of the working directory (rep=representatif ; term=terme) 
dirpath = os.path.join(os.getcwd()) 

### Open csv files and biological process file.
csvrepfile = open(dirpath + '/public/dag_treemap/rep2term.csv', 'r')
csvtermfile = open(dirpath + '/public/dag_treemap/term2gen.csv', 'r')

with open(dirpath +'/public/dag_treemap/biological_process.json') as BP:    
    biological_process = json.load(BP)


### Open and create the data file output (json)



jsonfile = open(dirpath+'/public/dag_treemap/data_treemap_dag.json', 'w')



### Outils: 
max_gene = 0
num_gene=0
terme=[]
gene=[] 
fieldgene = ["terme"]



### Create a fieldnames    
for i in range (10000) :      
    num_gene=num_gene+1
    fieldgene.append("gene"+str(num_gene))    
### Parse and take the data from the terme to gene csv file
readerterm2 = csv.DictReader( csvtermfile,fieldnames=fieldgene,delimiter=';')
for row in readerterm2:     
    all_genes=[]        
    for i in row :         
        if row[i] != "" and row[i] != None :
            if i == "terme":                
                terme.append(row[i])                
            else :                
                all_genes.append(row[i])   
    gene.append (all_genes)    


### Outils :
max_terme=0
num_terme=0
rep_cluster=[]
cterme=[]
list_cluster=[]
fieldcluster = ["Cluster"]

    
### Create a fieldnames
for i in range (10000) :      
    num_terme=num_terme+1
    fieldcluster.append("terme"+str(num_terme))
### Parse and take the data from the representatif to terme csv file
readerrep = csv.DictReader( csvrepfile,fieldnames=fieldcluster,delimiter=';')
for row in readerrep:    
    all_termes=[]     
    for i in row :       
        if row[i] != "" and row[i] != None :
            if i == "Cluster":                
                clus,rep=row[i].split(': ')                               
                rep_cluster.append(rep)                
            else:                
                all_termes.append(row[i])
    
    cterme.append (all_termes) 





### Outils
bio_process=biological_process["Class"]

rep=[]
bio_terme=[]
order_termes=[]
list_term=[]
tmp_termes=[]

### Parse the biological process file to take the information about the representatifs and termes use for the work
for t in range(len(bio_process)):
    for r in range (len(rep_cluster)):
        if rep_cluster[r]==str(bio_process[t]["name"]):         
            rep.append(bio_process[t])
            order_termes.append(cterme[r])
    for nt in range (len(terme)):
        if terme[nt]==str(bio_process[t]["name"]):
            tmp_termes.append(bio_process[t])

### Put the data in the same order in lists    
for ot in range (len(order_termes)):  
    list_term=[]
    print 'ok'
    for t in range (len(order_termes[ot])):             
        for tmp in range (len(tmp_termes)):            
            if (order_termes[ot][t]==tmp_termes[tmp]["name"]):
                
                list_term.append(tmp_termes[tmp])
    bio_terme.append(list_term)
    

### Write the data in the json file output (data_treemap_dag.json)      
        
jsonfile.write('{\n')
jsonfile.write('\t"Class": [ \n')
for i in range (len(rep)):
    jsonfile.write('\t{\n')
    jsonfile.write('\t\t"name": "' + str(rep[i]["name"])+'",\n')
    jsonfile.write('\t\t"id": "' + str(rep[i]["id"])+'",\n')    
    jsonfile.write('\t\t"Depth": ' + str(rep[i]["Depth"])+',\n')
    jsonfile.write('\t\t"ICNuno": ' + str(rep[i]["ICNuno"])+',\n')
    jsonfile.write('\t\t"ICZhou": ' + str(rep[i]["ICZhou"])+',\n')
    
    if (len(rep[i]["children"]))==0:
        jsonfile.write('\t\t"children": [],\n')
    else:
        jsonfile.write('\t\t"children": [')
        for ch in range(len(rep[i]["children"])):                        
            child=str(rep[i]["children"][ch])                    
            if ch==(len(rep[i]["children"])-1):
                jsonfile.write('\n\t\t\t"' + child+'"],\n')
            else:
                jsonfile.write('\n\t\t\t"' + child+'",') 
              
    if (len(rep[i]["descendant"]))==0:            
        jsonfile.write('\t\t"descendant": [],\n')
    else:
        jsonfile.write('\t\t"descendant": [')    
        for d in range(len(rep[i]["descendant"])):
            descendant=str(rep[i]["descendant"][d])            
            if d==(len(rep[i]["descendant"])-1):
                jsonfile.write('\n\t\t\t"'+descendant+'"\n') 
                jsonfile.write('\t\t\t],\n')
            else:
                jsonfile.write('\n\t\t\t"'+descendant+'",')
            
                    
    if (len(rep[i]["ancestor"]))==0:
        jsonfile.write('\t\t"ancestor": [],\n')    
    else:
        jsonfile.write('\t\t"ancestor": [')        
        for a in range(len(rep[i]["ancestor"])):
            ancestor=str(rep[i]["ancestor"][a])            
            if a==(len(rep[i]["ancestor"])-1):
                jsonfile.write('\n\t\t\t"' +ancestor+'"\n')                    
                jsonfile.write('\t\t\t],\n')
            else:
                jsonfile.write('\n\t\t\t"'+ancestor+'",')
        
    last_terme=False
    jsonfile.write('\t\t"termes" : [ \n')
    if (len(bio_terme[i])==0) :
            jsonfile.write('\t\t\t{}]\n')
    for obj in range (len (bio_terme[i])):        
        
        if obj==(len(bio_terme[i])-1) :
            last_terme=True        
            
        jsonfile.write('\t\t\t{"name" : "' + bio_terme[i][obj]["name"] +'",\n')
        jsonfile.write('\t\t\t"id" : "' + bio_terme[i][obj]["id"]+'",\n')
        jsonfile.write('\t\t\t"Depth": ' + str(bio_terme[i][obj]["Depth"])+',\n')
        jsonfile.write('\t\t\t"ICNuno": ' + str(bio_terme[i][obj]["ICNuno"])+',\n')
        jsonfile.write('\t\t\t"ICZhou": ' + str(bio_terme[i][obj]["ICZhou"])+',\n')
        if (len(bio_terme[i][obj]["children"]))==0:
            jsonfile.write('\t\t\t"children": [],\n')
        else:
            jsonfile.write('\t\t\t"children": [')
            for ch in range(len(bio_terme[i][obj]["children"])):                        
                child=str(bio_terme[i][obj]["children"][ch])                    
                if ch==(len(bio_terme[i][obj]["children"])-1):
                    jsonfile.write('\n\t\t\t\t"' + child+'"],\n')
                else:
                    jsonfile.write('\n\t\t\t\t"' + child+'",')                
        
        if (len(bio_terme[i][obj]["ancestor"]))==0:
            jsonfile.write('\t\t\t"ancestor": [],\n')    
        else:
            jsonfile.write('\t\t\t"ancestor": [')        
            for a in range(len(bio_terme[i][obj]["ancestor"])):
                ancestor=str(bio_terme[i][obj]["ancestor"][a])            
                if a==(len(bio_terme[i][obj]["ancestor"])-1):
                    jsonfile.write('\n\t\t\t\t"' +ancestor+'"\n')                    
                    jsonfile.write('\t\t\t\t],\n')
                else:
                    jsonfile.write('\n\t\t\t\t"'+ancestor+'",')
            
        jsonfile.write('\t\t\t"genes" : [ \n')
        for term in range(len(terme)) :
            if bio_terme[i][obj]["name"]==terme[term]:
                for g in range (len(gene[term])) :                    
                    if g == (len(gene[term])-1):
                        jsonfile.write('\t\t\t\t { "name" : "' + gene[term][g] + '"}] \n')                                
                    else:
                        jsonfile.write('\t\t\t\t { "name" : "' + gene[term][g] + '"}, \n')
        if not last_terme and len(bio_terme[i])!=0 :
            jsonfile.write('\t\t\t},\n')
        if last_terme :
            jsonfile.write('\t\t\t}]\n')                        
            
            
    
                
        
    if i==(len(rep)-1):
        jsonfile.write('\t\t}\n')
        jsonfile.write('\t]\n')
    else:
        jsonfile.write('\t},\n')
jsonfile.write('}')
        
    
    















