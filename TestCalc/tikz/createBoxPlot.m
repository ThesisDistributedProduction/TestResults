
clc;
clear all;
close all;

NumberOfSampelsToUse = 1000;
rootFolder = '/home/stefan/work/TestResults/';
folder = [rootFolder 'Test7_Centralized_12-13-2014_1623'];

fileList = java.util.LinkedList;
li=fileList.listIterator;
li.add('/CentralizedLog0.csv');
li.add('/CentralizedLog1.csv');
li.add('/CentralizedLog2.csv');
li.add('/CentralizedLog3.csv');
li.add('/CentralizedLog4.csv');
li.add('/CentralizedLog5.csv');
li.add('/CentralizedLog6.csv');
li.add('/CentralizedLog7.csv');
li.add('/CentralizedLog8.csv');
li.add('/CentralizedLog9.csv');
li.add('/CentralizedLog10.csv');
li.add('/CentralizedLog11.csv');
li.add('/CentralizedLog12.csv');
li.add('/CentralizedLog13.csv');
li.add('/CentralizedLog14.csv');
li.add('/CentralizedLog15.csv');
li.add('/CentralizedLog16.csv');
li.add('/CentralizedLog17.csv');
li.add('/CentralizedLog18.csv');
li.add('/CentralizedLog19.csv');

s = fileList.size();

X = [];
for n = 0:s-1
    fileName = fileList.get(n);
    file = [folder fileName]
    t = csvread(file,1,2);
    t = t(:,1);
    t = t / 1000000;
    t = t(1:NumberOfSampelsToUse);
    X = [X t];
end

figure
boxplot(X)
matlab2tikz('results/Test7_nTurbines.tex')


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

clc;


rootFolder = '/home/stefan/work/TestResults/';
folder = [rootFolder 'Test5_Decentralized_success_12-4-2014_2100/nTurbines'];

fileList = java.util.LinkedList;
li=fileList.listIterator;
li.add('/DecentralizedLog0.csv');
li.add('/DecentralizedLog1.csv');
li.add('/DecentralizedLog2.csv');
li.add('/DecentralizedLog3.csv');
li.add('/DecentralizedLog4.csv');
li.add('/DecentralizedLog5.csv');
li.add('/DecentralizedLog6.csv');
li.add('/DecentralizedLog7.csv');
li.add('/DecentralizedLog8.csv');
li.add('/DecentralizedLog9.csv');
li.add('/DecentralizedLog10.csv');
li.add('/DecentralizedLog11.csv');
li.add('/DecentralizedLog12.csv');
li.add('/DecentralizedLog13.csv');
li.add('/DecentralizedLog14.csv');
li.add('/DecentralizedLog15.csv');
li.add('/DecentralizedLog16.csv');
li.add('/DecentralizedLog17.csv');
li.add('/DecentralizedLog18.csv');
li.add('/DecentralizedLog19.csv');

s = fileList.size();

X = [];
for n = 0:s-1
    fileName = fileList.get(n);
    file = [folder fileName]
    t = csvread(file,1,7);
    t = t(:,1);
    t = t / 1000000;
    t = t(1:NumberOfSampelsToUse);
%     t = t(1:14000);
    X = [X t];
end

figure
boxplot(X)
matlab2tikz('results/Test5_nTurbines.tex')


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
clc;

rootFolder = '/home/stefan/work/TestResults/';
folder = [rootFolder 'Test5_Decentralized_success_12-4-2014_2100/nSleepTime'];

fileList = [
    [folder '/DecentralizedLog0.csv'],
    [folder '/DecentralizedLog1.csv'],
    [folder '/DecentralizedLog2.csv'],
    [folder '/DecentralizedLog3.csv'],
    [folder '/DecentralizedLog4.csv'],
    [folder '/DecentralizedLog5.csv'],
    [folder '/DecentralizedLog6.csv'],
    [folder '/DecentralizedLog7.csv'],
    [folder '/DecentralizedLog8.csv']
    ];
[s, t] = size(fileList);
X = [];
for n = 1:s
    file = fileList(n,:)
    t = csvread(file,1,7);
    t = t(:,1);
    t = t / 1000000;
    t = t(1:NumberOfSampelsToUse);
%     t = t(1:50000);
    X = [X t];
end

figure
boxplot(X)
matlab2tikz('results/Test5_nCycleTime.tex')

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
clc;

rootFolder = '/home/stefan/work/TestResults/';
folder = [rootFolder 'Test6_Decentralized_12-7-2014_1327/nCycleTime'];

fileList = [
    [folder '/DecentralizedLog1.csv'],
    [folder '/DecentralizedLog2.csv'],
    [folder '/DecentralizedLog3.csv'],
    [folder '/DecentralizedLog4.csv'],
    [folder '/DecentralizedLog5.csv'],
    [folder '/DecentralizedLog6.csv'],
    [folder '/DecentralizedLog7.csv'],
    [folder '/DecentralizedLog8.csv'],
    [folder '/DecentralizedLog9.csv']
    ];
[s, t] = size(fileList);
X = [];

for n = 1:s
    file = fileList(n,:)
    t = csvread(file,1,7);
    t = t(:,1);
    t = t / 1000000;
    t = t(1:NumberOfSampelsToUse);
%     t = t(1:50000);
    X = [X t];
end

figure
boxplot(X)
matlab2tikz('results/Test6_nCycleTime.tex')





